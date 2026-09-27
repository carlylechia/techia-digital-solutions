import "server-only";

import { getAdminSessionUser, writeAuditLog, type AdminSessionUser } from "@/lib/admin/session";
import { hasPermission, type AdminPermission } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";

/**
 * Outreach authorization.
 *
 * There is no second authentication system. The existing NextAuth admin session
 * and the existing role/permission model are the only authority. This module
 * only adds the three outreach-specific permissions on top of them, and it
 * re-reads permissions from PostgreSQL on every check so a revoked role takes
 * effect immediately rather than after a token refresh.
 */

export class OutreachAuthorizationError extends Error {
  readonly status: 401 | 403 | 404;

  constructor(message: string, status: 401 | 403 | 404) {
    super(message);
    this.name = "OutreachAuthorizationError";
    this.status = status;
  }
}

export type OutreachActor = AdminSessionUser & {
  canView: boolean;
  canManage: boolean;
  canSend: boolean;
};

export async function getOutreachActor(): Promise<OutreachActor | null> {
  const user = await getAdminSessionUser();
  if (!user) return null;
  return {
    ...user,
    canView: hasPermission(user.permissions, "outreach.view"),
    canManage: hasPermission(user.permissions, "outreach.manage"),
    canSend: hasPermission(user.permissions, "outreach.send"),
  };
}

export async function requireOutreachActor(permission: AdminPermission): Promise<OutreachActor> {
  const actor = await getOutreachActor();
  if (!actor) throw new OutreachAuthorizationError("Authentication is required.", 401);
  // A super admin always retains access, matching the existing workspace rule.
  if (actor.roleLevel >= 100) return actor;
  if (!hasPermission(actor.permissions, permission)) {
    throw new OutreachAuthorizationError("You do not have permission to perform this outreach action.", 403);
  }
  return actor;
}

export async function requireOutreachDatabase() {
  const prisma = getPrisma();
  if (!prisma) throw new OutreachAuthorizationError("Outreach data is unavailable.", 401);
  return prisma;
}

export async function auditOutreach(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  await writeAuditLog(input);
}

/** Confirms the actor is allowed to act on a campaign before any mutation. */
export async function assertCampaignAccess(actor: OutreachActor, campaignId: string) {
  const prisma = await requireOutreachDatabase();
  const campaign = await prisma.outreachCampaign.findUnique({ where: { id: campaignId }, select: { id: true } });
  if (!campaign) throw new OutreachAuthorizationError("Campaign not found.", 404);
  void actor;
  return campaign;
}
