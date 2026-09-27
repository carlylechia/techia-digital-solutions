"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/prisma-errors";
import {
  OutreachAuthorizationError,
  auditOutreach,
  requireOutreachActor,
  requireOutreachDatabase,
} from "@/lib/outreach/auth";
import { recordEvent, recordStatusChange } from "@/lib/outreach/events";
import { enqueueJob } from "@/lib/outreach/jobs";
import { suppressContact, unsubscribeContact } from "@/lib/outreach/suppression";
import { incrementDailyStat } from "@/lib/outreach/stats";
import { runDailyOrchestrator } from "@/lib/outreach/orchestrator";
import { getOutreachSendingState } from "@/lib/outreach/config";
import { normalizeEmail } from "@/lib/outreach/limits";
import {
  outreachCampaignSchema,
  outreachMeetingSchema,
  outreachMessageReviewSchema,
  outreachProspectPatchSchema,
  outreachSuppressionSchema,
} from "@/lib/outreach/validation";
import { OUTREACH_CAMPAIGN_STATUSES, OUTREACH_PROSPECT_STATUSES } from "@/lib/outreach/constants";

/**
 * Every outreach mutation.
 *
 * Each action re-reads the admin session and the campaign from PostgreSQL, so a
 * permission revoked after page load cannot still perform a write. The pattern
 * matches the existing admin workspace actions.
 */

export type OutreachActionResult = { ok: true; message: string } | { ok: false; error: string };

function toResult(error: unknown): OutreachActionResult {
  if (error instanceof OutreachAuthorizationError) {
    return { ok: false, error: error.status === 401 ? "Please sign in again." : "You do not have permission to do that." };
  }
  console.error("[outreach-action] failed", getErrorMessage(error));
  return { ok: false, error: "That action could not be completed. Check the server logs." };
}

function revalidateOutreach(...paths: string[]) {
  for (const path of ["/admin/outreach", ...paths]) {
    revalidatePath(path);
  }
}

export async function saveOutreachCampaign(input: unknown): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const parsed = outreachCampaignSchema.parse(input);
    const id = typeof (input as { id?: string }).id === "string" ? (input as { id?: string }).id : undefined;

    const data = {
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      mode: parsed.mode,
      country: parsed.country,
      regions: parsed.regions,
      cities: parsed.cities,
      industries: parsed.industries,
      businessTypes: parsed.businessTypes,
      targetServices: parsed.targetServices,
      excludedIndustries: parsed.excludedIndustries,
      excludedKeywords: parsed.excludedKeywords,
      dailyDiscoveryLimit: parsed.dailyDiscoveryLimit,
      dailySendLimit: parsed.dailySendLimit,
      minOpportunityScore: parsed.minOpportunityScore,
      dailyAiAssessLimit: parsed.dailyAiAssessLimit,
      requireApproval: parsed.requireApproval,
      followUpEnabled: parsed.followUpEnabled,
      maxFollowUps: parsed.maxFollowUps,
      sendingWindowStart: parsed.sendingWindowStart,
      sendingWindowEnd: parsed.sendingWindowEnd,
      timezone: parsed.timezone,
      discoveryProviderMode: parsed.discoveryProviderMode,
      complianceBasis: parsed.complianceBasis,
      complianceNote: parsed.complianceNote,
      unsubscribeNote: parsed.unsubscribeNote,
      senderNameOverride: parsed.senderNameOverride,
    };

    const campaign = id
      ? await db.outreachCampaign.update({ where: { id }, data, select: { id: true } })
      : await db.outreachCampaign.create({
          data: { ...data, startedAt: parsed.status === "ACTIVE" ? new Date() : null },
          select: { id: true },
        });

    await auditOutreach({
      actorId: actor.id,
      action: id ? "outreach.campaign_updated" : "outreach.campaign_created",
      entityType: "OutreachCampaign",
      entityId: campaign.id,
      metadata: { status: parsed.status, mode: parsed.mode, requireApproval: parsed.requireApproval },
    });

    revalidateOutreach("/admin/outreach/campaigns", `/admin/outreach/campaigns/${campaign.id}`);
    return { ok: true, message: id ? "Campaign updated." : "Campaign created." };
  } catch (error) {
    return toResult(error);
  }
}

export async function setOutreachCampaignStatus(input: { campaignId: string; status: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const campaignId = String(input.campaignId ?? "").slice(0, 64);
    const status = OUTREACH_CAMPAIGN_STATUSES.find((value) => value === input.status);
    if (!campaignId || !status) return { ok: false, error: "Invalid campaign status." };

    const existing = await db.outreachCampaign.findUnique({ where: { id: campaignId }, select: { id: true, status: true, name: true } });
    if (!existing) return { ok: false, error: "Campaign not found." };

    await db.outreachCampaign.update({
      where: { id: campaignId },
      data: {
        status,
        startedAt: status === "ACTIVE" && !existing.status ? new Date() : undefined,
        completedAt: status === "COMPLETED" || status === "ARCHIVED" ? new Date() : null,
      },
    });

    await recordEvent({
      type: "STATUS_CHANGED",
      campaignId,
      summary: `Campaign ${existing.status} → ${status}`,
      metadata: { from: existing.status, to: status },
      actorId: actor.id,
    });
    await auditOutreach({ actorId: actor.id, action: "outreach.campaign_status_changed", entityType: "OutreachCampaign", entityId: campaignId, metadata: { from: existing.status, to: status } });

    // Stopping a campaign must also stop its pending work.
    if (status !== "ACTIVE") {
      await db.outreachJob.updateMany({
        where: { campaignId, status: "PENDING" },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
    }

    revalidateOutreach("/admin/outreach/campaigns", `/admin/outreach/campaigns/${campaignId}`);
    return { ok: true, message: `Campaign is now ${status.toLowerCase()}.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function reviewOutreachMessage(input: unknown): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const parsed = outreachMessageReviewSchema.parse(input);

    const message = await db.outreachMessage.findUnique({
      where: { id: parsed.messageId },
      include: { prospect: { select: { id: true, status: true, businessName: true } }, campaign: { select: { id: true, name: true, requireApproval: true } } },
    });
    if (!message) return { ok: false, error: "That message no longer exists." };

    if (parsed.action === "APPROVE") {
      if (message.status === "SENT" || message.status === "DELIVERED") {
        return { ok: false, error: "This message has already been sent." };
      }
      await db.outreachMessage.update({
        where: { id: message.id },
        data: { status: "APPROVED", approvedAt: new Date(), approvedById: actor.id, failureReason: null },
      });
      await recordEvent({
        type: "EMAIL_APPROVED",
        campaignId: message.campaignId,
        prospectId: message.prospectId,
        messageId: message.id,
        summary: message.subject.slice(0, 160),
        actorId: actor.id,
        metadata: { type: message.type },
      });
      await incrementDailyStat(message.campaignId, "approved", 1);
      await enqueueJob({
        type: "SEND_EMAIL",
        campaignId: message.campaignId,
        prospectId: message.prospectId,
        dedupeKey: `SEND_EMAIL:${message.id}`,
        payload: { messageId: message.id },
      });
    } else if (parsed.action === "REJECT") {
      await db.outreachMessage.update({ where: { id: message.id }, data: { status: "CANCELLED", failureReason: "Rejected by an administrator." } });
      await recordEvent({
        type: "STATUS_CHANGED",
        campaignId: message.campaignId,
        prospectId: message.prospectId,
        messageId: message.id,
        summary: "Message rejected by an administrator.",
        actorId: actor.id,
      });
      await db.outreachProspect.update({ where: { id: message.prospectId }, data: { status: "DISQUALIFIED" } }).catch(() => undefined);
    } else if (parsed.action === "EDIT") {
      await db.outreachMessage.update({
        where: { id: message.id },
        data: {
          subject: parsed.subject ?? message.subject,
          bodyText: parsed.bodyText ?? message.bodyText,
          aiGenerated: false,
          status: message.status === "SENT" ? message.status : "PENDING_APPROVAL",
        },
      });
      await recordEvent({
        type: "STATUS_CHANGED",
        campaignId: message.campaignId,
        prospectId: message.prospectId,
        messageId: message.id,
        summary: "Message edited by an administrator.",
        actorId: actor.id,
      });
    } else {
      await db.outreachProspect.update({
        where: { id: message.prospectId },
        data: { status: "PAUSED", automationStoppedReason: "paused_by_admin", nextActionAt: null },
      });
      await db.outreachJob.updateMany({
        where: { prospectId: message.prospectId, status: "PENDING" },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
      await recordStatusChange({
        prospectId: message.prospectId,
        campaignId: message.campaignId,
        from: message.prospect.status,
        to: "PAUSED",
        reason: "Paused by an administrator.",
        actorId: actor.id,
      });
    }

    await auditOutreach({ actorId: actor.id, action: `outreach.message_${parsed.action.toLowerCase()}`, entityType: "OutreachMessage", entityId: message.id });

    revalidateOutreach("/admin/outreach/review", `/admin/outreach/prospects/${message.prospectId}`);
    return { ok: true, message: `Message ${parsed.action.toLowerCase().replace("_", " ")}d.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function updateOutreachProspect(input: unknown): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const parsed = outreachProspectPatchSchema.parse(input);

    const existing = await db.outreachProspect.findUnique({ where: { id: parsed.id }, select: { id: true, status: true, campaignId: true, businessName: true } });
    if (!existing) return { ok: false, error: "Prospect not found." };

    const email = parsed.publicEmail === undefined ? undefined : normalizeEmail(parsed.publicEmail);

    await db.outreachProspect.update({
      where: { id: parsed.id },
      data: {
        businessName: parsed.businessName || undefined,
        websiteUrl: parsed.websiteUrl || null,
        publicEmail: email,
        publicPhone: parsed.publicPhone || null,
        contactName: parsed.contactName || null,
        contactRole: parsed.contactRole || null,
        industry: parsed.industry || null,
        city: parsed.city || null,
        status: parsed.status ?? undefined,
        automationStoppedReason: parsed.status && parsed.status !== "PAUSED" ? null : undefined,
      },
    });

    if (parsed.status && parsed.status !== existing.status) {
      await recordStatusChange({
        prospectId: parsed.id,
        campaignId: existing.campaignId,
        from: existing.status,
        to: parsed.status,
        reason: "Updated by an administrator.",
        actorId: actor.id,
      });
    }

    if (parsed.note) {
      await recordEvent({
        type: "MANUAL_NOTE",
        campaignId: existing.campaignId,
        prospectId: parsed.id,
        summary: parsed.note.slice(0, 500),
        actorId: actor.id,
      });
    }

    await auditOutreach({ actorId: actor.id, action: "outreach.prospect_updated", entityType: "OutreachProspect", entityId: parsed.id });
    revalidateOutreach("/admin/outreach/prospects", `/admin/outreach/prospects/${parsed.id}`);
    return { ok: true, message: "Prospect updated." };
  } catch (error) {
    return toResult(error);
  }
}

export async function setOutreachProspectStatus(input: { prospectId: string; status: string; reason?: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const prospectId = String(input.prospectId ?? "").slice(0, 64);
    const status = OUTREACH_PROSPECT_STATUSES.find((value) => value === input.status);
    if (!prospectId || !status) return { ok: false, error: "Invalid prospect status." };

    const existing = await db.outreachProspect.findUnique({ where: { id: prospectId }, select: { id: true, status: true, campaignId: true } });
    if (!existing) return { ok: false, error: "Prospect not found." };

    const terminal = ["WON", "LOST", "UNSUBSCRIBED", "PAUSED", "DISQUALIFIED"].includes(status);
    await db.outreachProspect.update({
      where: { id: prospectId },
      data: {
        status,
        automationStoppedReason: terminal ? (status === "PAUSED" ? "paused_by_admin" : `manual_${status.toLowerCase()}`) : null,
        nextActionAt: terminal ? null : undefined,
      },
    });

    if (terminal) {
      await db.outreachJob.updateMany({
        where: { prospectId, status: "PENDING" },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
    }

    if (status === "UNSUBSCRIBED") {
      const prospect = await db.outreachProspect.findUnique({ where: { id: prospectId }, select: { publicEmail: true } });
      if (prospect?.publicEmail) await suppressContact({ email: prospect.publicEmail, reason: "UNSUBSCRIBED", source: "admin", notes: input.reason ?? null, prospectId });
    }

    await recordStatusChange({
      prospectId,
      campaignId: existing.campaignId,
      from: existing.status,
      to: status,
      reason: input.reason ?? "Updated by an administrator.",
      actorId: actor.id,
    });
    await auditOutreach({ actorId: actor.id, action: "outreach.prospect_status_changed", entityType: "OutreachProspect", entityId: prospectId, metadata: { from: existing.status, to: status } });

    revalidateOutreach("/admin/outreach/prospects", `/admin/outreach/prospects/${prospectId}`);
    return { ok: true, message: `Prospect marked as ${status.toLowerCase()}.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function createOutreachSuppression(input: unknown): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    await requireOutreachDatabase();
    const parsed = outreachSuppressionSchema.parse(input);
    const email = parsed.email ? normalizeEmail(parsed.email) : null;

    const row = await suppressContact({
      email,
      domain: parsed.domain || null,
      reason: parsed.reason,
      source: "admin",
      notes: parsed.notes || null,
    });
    if (!row) return { ok: false, error: "Could not create the suppression entry." };

    await auditOutreach({ actorId: actor.id, action: "outreach.suppression_created", entityType: "OutreachSuppression", entityId: row.id, metadata: { reason: parsed.reason, scope: email ? "email" : "domain" } });
    revalidateOutreach("/admin/outreach/suppression");
    return { ok: true, message: "Address added to the suppression list." };
  } catch (error) {
    return toResult(error);
  }
}

export async function deleteOutreachSuppression(input: { id: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.send");
    const db = await requireOutreachDatabase();
    const id = String(input.id ?? "").slice(0, 64);
    if (!id) return { ok: false, error: "Invalid suppression id." };

    const existing = await db.outreachSuppression.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return { ok: false, error: "Suppression entry not found." };

    await db.outreachSuppression.delete({ where: { id } });
    await auditOutreach({ actorId: actor.id, action: "outreach.suppression_removed", entityType: "OutreachSuppression", entityId: id });
    revalidateOutreach("/admin/outreach/suppression");
    return { ok: true, message: "Suppression entry removed." };
  } catch (error) {
    return toResult(error);
  }
}

export async function unsubscribeOutreachProspect(input: { prospectId: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const prospectId = String(input.prospectId ?? "").slice(0, 64);
    const prospect = await db.outreachProspect.findUnique({ where: { id: prospectId }, select: { id: true, publicEmail: true, campaignId: true, status: true } });
    if (!prospect) return { ok: false, error: "Prospect not found." };
    if (!prospect.publicEmail) return { ok: false, error: "This prospect has no stored email address." };

    await unsubscribeContact(prospect.publicEmail, prospect.id);
    await recordStatusChange({ prospectId, campaignId: prospect.campaignId, from: prospect.status, to: "UNSUBSCRIBED", reason: "Unsubscribed by an administrator.", actorId: actor.id });
    await auditOutreach({ actorId: actor.id, action: "outreach.prospect_unsubscribed", entityType: "OutreachProspect", entityId: prospectId });

    revalidateOutreach(`/admin/outreach/prospects/${prospectId}`, "/admin/outreach/suppression");
    return { ok: true, message: "Prospect unsubscribed and suppressed." };
  } catch (error) {
    return toResult(error);
  }
}

export async function saveOutreachMeeting(input: unknown): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const parsed = outreachMeetingSchema.parse(input);

    const prospect = await db.outreachProspect.findUnique({ where: { id: parsed.prospectId }, select: { id: true, campaignId: true, status: true } });
    if (!prospect) return { ok: false, error: "Prospect not found." };

    const meeting = await db.outreachMeeting.create({
      data: {
        prospectId: prospect.id,
        status: parsed.status,
        scheduledAt: parsed.scheduledAt,
        duration: parsed.duration,
        bookingUrl: parsed.bookingUrl || null,
        meetingUrl: parsed.meetingUrl || null,
        notes: parsed.notes || null,
      },
      select: { id: true },
    });

    await db.outreachProspect.update({ where: { id: prospect.id }, data: { status: "MEETING_BOOKED", automationStoppedReason: "meeting_booked", nextActionAt: null } }).catch(() => undefined);
    await db.outreachJob.updateMany({ where: { prospectId: prospect.id, status: "PENDING" }, data: { status: "CANCELLED", completedAt: new Date() } });
    await recordEvent({ type: "MEETING_BOOKED", campaignId: prospect.campaignId, prospectId: prospect.id, summary: `Meeting ${parsed.status.toLowerCase()}`, actorId: actor.id, metadata: { scheduledAt: parsed.scheduledAt.toISOString(), duration: parsed.duration } });
    await incrementDailyStat(prospect.campaignId, "meetings", 1, parsed.scheduledAt);
    await auditOutreach({ actorId: actor.id, action: "outreach.meeting_created", entityType: "OutreachMeeting", entityId: meeting.id });

    revalidateOutreach("/admin/outreach/meetings", `/admin/outreach/prospects/${prospect.id}`);
    return { ok: true, message: "Meeting recorded." };
  } catch (error) {
    return toResult(error);
  }
}

export async function setOutreachMeetingStatus(input: { meetingId: string; status: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const meetingId = String(input.meetingId ?? "").slice(0, 64);
    const status = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].find((value) => value === input.status) as
      | "SCHEDULED"
      | "COMPLETED"
      | "CANCELLED"
      | "NO_SHOW"
      | undefined;
    if (!meetingId || !status) return { ok: false, error: "Invalid meeting status." };

    const existing = await db.outreachMeeting.findUnique({ where: { id: meetingId }, select: { id: true, status: true, prospectId: true } });
    if (!existing) return { ok: false, error: "Meeting not found." };

    await db.outreachMeeting.update({ where: { id: meetingId }, data: { status } });
    await recordEvent({
      type: "STATUS_CHANGED",
      prospectId: existing.prospectId,
      summary: `Meeting ${existing.status} → ${status}`,
      actorId: actor.id,
      metadata: { meetingId, from: existing.status, to: status },
    });
    await auditOutreach({ actorId: actor.id, action: "outreach.meeting_status_changed", entityType: "OutreachMeeting", entityId: meetingId, metadata: { from: existing.status, to: status } });

    revalidateOutreach("/admin/outreach/meetings");
    return { ok: true, message: `Meeting marked as ${status.toLowerCase()}.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function triggerOutreachDiscovery(input: { campaignId: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const campaignId = String(input.campaignId ?? "").slice(0, 64);
    const campaign = await db.outreachCampaign.findUnique({ where: { id: campaignId }, select: { id: true, name: true, status: true } });
    if (!campaign) return { ok: false, error: "Campaign not found." };
    if (campaign.status !== "ACTIVE") return { ok: false, error: "Only an active campaign can run discovery." };

    const jobId = await enqueueJob({ type: "DISCOVER", campaignId, payload: { reason: "manual_trigger", actorId: actor.id } });
    if (!jobId) return { ok: false, error: "Could not queue discovery." };

    await auditOutreach({ actorId: actor.id, action: "outreach.discovery_triggered", entityType: "OutreachCampaign", entityId: campaignId, metadata: { jobId } });
    revalidateOutreach(`/admin/outreach/campaigns/${campaignId}`);
    return { ok: true, message: "Discovery queued. It runs on the next job-processor tick." };
  } catch (error) {
    return toResult(error);
  }
}

export async function enqueueOutreachProspectJob(input: { prospectId: string; step: "ENRICH" | "ASSESS" | "GENERATE_EMAIL" }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const prospectId = String(input.prospectId ?? "").slice(0, 64);
    const step = (["ENRICH", "ASSESS", "GENERATE_EMAIL"] as const).find((value) => value === input.step);
    if (!prospectId || !step) return { ok: false, error: "Invalid request." };

    const prospect = await db.outreachProspect.findUnique({ where: { id: prospectId }, select: { id: true, campaignId: true, status: true } });
    if (!prospect) return { ok: false, error: "Prospect not found." };

    const jobId = await enqueueJob({
      type: step,
      campaignId: prospect.campaignId,
      prospectId,
      dedupeKey: `${step}:${prospectId}:manual:${Date.now()}`,
      payload: { messageType: "INITIAL", reason: "manual_trigger", actorId: actor.id },
    });
    if (!jobId) return { ok: false, error: "Could not queue the job." };

    await auditOutreach({ actorId: actor.id, action: `outreach.${step.toLowerCase()}_triggered`, entityType: "OutreachProspect", entityId: prospectId, metadata: { jobId } });
    revalidateOutreach(`/admin/outreach/prospects/${prospectId}`);
    return { ok: true, message: `${step} queued.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function cancelOutreachCampaignJobs(input: { campaignId: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.send");
    const db = await requireOutreachDatabase();
    const campaignId = String(input.campaignId ?? "").slice(0, 64);
    if (!campaignId) return { ok: false, error: "Invalid campaign." };

    const result = await db.outreachJob.updateMany({
      where: { campaignId, status: "PENDING" },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    await db.outreachMessage.updateMany({
      where: { campaignId, status: { in: ["QUEUED", "APPROVED"] } },
      data: { status: "CANCELLED", failureReason: "Campaign paused by an administrator." },
    });

    await auditOutreach({ actorId: actor.id, action: "outreach.jobs_cancelled", entityType: "OutreachCampaign", entityId: campaignId, metadata: { cancelled: result.count } });
    revalidateOutreach(`/admin/outreach/campaigns/${campaignId}`);
    return { ok: true, message: `Paused the campaign and cancelled ${result.count} queued job(s).` };
  } catch (error) {
    return toResult(error);
  }
}

export async function recordOutreachReply(input: { prospectId: string; subject: string; body: string }): Promise<OutreachActionResult> {
  try {
    const actor = await requireOutreachActor("outreach.manage");
    const db = await requireOutreachDatabase();
    const prospectId = String(input.prospectId ?? "").slice(0, 64);
    const body = String(input.body ?? "").slice(0, 20_000);
    if (!prospectId || body.length < 1) return { ok: false, error: "A reply body is required." };

    const prospect = await db.outreachProspect.findUnique({ where: { id: prospectId }, select: { id: true } });
    if (!prospect) return { ok: false, error: "Prospect not found." };

    const jobId = await enqueueJob({
      type: "PROCESS_REPLY",
      prospectId,
      dedupeKey: `PROCESS_REPLY:${prospectId}:manual:${Date.now()}`,
      payload: { prospectId, subject: String(input.subject ?? "").slice(0, 300), body, source: "admin", actorId: actor.id },
    });
    if (!jobId) return { ok: false, error: "Could not queue the reply." };

    await auditOutreach({ actorId: actor.id, action: "outreach.reply_recorded", entityType: "OutreachProspect", entityId: prospectId, metadata: { jobId } });
    revalidateOutreach("/admin/outreach/conversations", `/admin/outreach/prospects/${prospectId}`);
    return { ok: true, message: "Reply recorded and queued for classification." };
  } catch (error) {
    return toResult(error);
  }
}

export async function runOutreachOrchestratorNow(): Promise<OutreachActionResult> {
  try {
    // `outreach.send` is the highest outreach permission, so running the whole
    // pipeline by hand requires it. The orchestrator itself re-enforces every
    // limit, approval rule, suppression check and the global kill switch, so this
    // button cannot cause an email that the scheduler would have refused.
    const actor = await requireOutreachActor("outreach.send");
    await requireOutreachDatabase();

    const result = await runDailyOrchestrator();
    const summary = `${result.dueWork.jobsCompleted} completed, ${result.dueWork.jobsDeferred} deferred, ${result.dueWork.jobsFailed} failed`;

    await auditOutreach({
      actorId: actor.id,
      action: "outreach.orchestrator_run_manually",
      entityType: "OutreachJob",
      metadata: {
        durationMs: result.durationMs,
        dueWork: result.dueWork,
        failedPhases: result.phases.filter((phase) => !phase.ok).map((phase) => phase.phase),
      },
    });

    revalidateOutreach("/admin/outreach", "/admin/outreach/settings");
    return { ok: true, message: `Orchestrator run finished: ${summary}.` };
  } catch (error) {
    return toResult(error);
  }
}

export async function getOutreachSendingStatus() {
  const prisma = getPrisma();
  if (!prisma) return { available: false as const };
  const state = getOutreachSendingState();
  return { available: true as const, ...state };
}
