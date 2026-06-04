import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import {
  AILeadConvertForm,
  AILeadEmailForm,
  AILeadStatusForm,
} from "@/components/admin/ai-lead-detail-forms";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Logo } from "@/components/brand/Logo";
import { isLocale, type Locale } from "@/content/site";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    title: locale === "fr" ? "Détail Lead IA · Admin · teChia" : "AI Lead Detail · Admin · teChia",
    robots: { index: false, follow: false },
  };
}

const SCORE_COLORS: Record<string, string> = {
  HOT: "bg-red-500/10 text-red-400 border-red-500/20",
  WARM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COLD: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-accent/10 text-accent border-accent/20",
  CONTACTED: "bg-green-500/10 text-green-400 border-green-500/20",
  QUALIFIED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  CONVERTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-sm text-primary">{value}</span>
    </div>
  );
}

export default async function AILeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
        <section className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mb-6 flex justify-center sm:mb-8">
            <Logo locale={locale} variant="horizontal" size="md" theme="auto" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Secure admin</p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl md:text-6xl">AI Lead Detail</h1>
        </section>
        <AdminLoginForm locale={locale} />
      </main>
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-primary">
        <p className="text-muted">Database unavailable.</p>
      </main>
    );
  }

  const lead = await prisma.aILead.findUnique({ where: { id } }).catch(() => null);
  if (!lead) notFound();

  // Load the linked AI conversation and its messages if present
  const conversation =
    lead.conversationId
      ? await prisma.aIConversation
          .findUnique({
            where: { id: lead.conversationId },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          })
          .catch(() => null)
      : null;

  const baseLeadsHref = `/${locale}/admin/ai-leads`;

  return (
    <main className="min-h-dvh bg-background px-3 py-8 text-primary sm:px-4 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div>
          <a
            href={baseLeadsHref}
            className="text-xs text-muted hover:text-primary transition-colors"
          >
            ← AI Leads
          </a>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{lead.name || "Unnamed Lead"}</h1>
            <span
              className={[
                "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                SCORE_COLORS[lead.leadScore] ?? "bg-muted/10 text-muted border-muted/20",
              ].join(" ")}
            >
              {lead.leadScore}
            </span>
            <span
              className={[
                "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                STATUS_COLORS[lead.status] ?? "bg-muted/10 text-muted border-muted/20",
              ].join(" ")}
            >
              {lead.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Created {lead.createdAt.toLocaleString()} · Updated {lead.updatedAt.toLocaleString()}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: lead info + actions */}
          <div className="space-y-6 lg:col-span-2">

            {/* Lead Details */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                Lead Information
              </h2>
              <div className="space-y-3">
                <InfoRow label="Name" value={lead.name} />
                <InfoRow label="Email" value={lead.email} />
                <InfoRow label="Phone" value={lead.phone} />
                <InfoRow label="Company" value={lead.companyName} />
                <InfoRow label="Industry" value={lead.industry} />
                <InfoRow label="Service" value={lead.serviceInterest} />
                <InfoRow label="Budget" value={lead.budgetRange} />
                <InfoRow label="Timeline" value={lead.timeline} />
                <InfoRow label="Source" value={lead.source} />
                {lead.conversationId && (
                  <InfoRow label="Conversation ID" value={lead.conversationId} />
                )}
              </div>

              {lead.projectSummary && (
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    AI Project Summary
                  </p>
                  <p className="text-sm leading-relaxed text-primary">{lead.projectSummary}</p>
                </div>
              )}
            </section>

            {/* Conversation Transcript */}
            {conversation && conversation.messages.length > 0 && (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-accent">
                  AI Chat Transcript
                </h2>
                <p className="mb-4 text-xs text-muted">
                  {conversation.messageCount} messages ·{" "}
                  {conversation.totalTokens.toLocaleString()} tokens ·{" "}
                  Session {conversation.sessionId.slice(0, 12)}…
                </p>

                {conversation.summary && (
                  <div className="mb-4 rounded-xl border border-border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                      Conversation Summary
                    </p>
                    <p className="text-sm leading-relaxed text-primary">{conversation.summary}</p>
                  </div>
                )}

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {conversation.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={["flex gap-3", isUser ? "flex-row-reverse" : "flex-row"].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            isUser
                              ? "bg-accent/20 text-accent"
                              : "bg-purple-500/20 text-purple-400",
                          ].join(" ")}
                        >
                          {isUser ? "U" : "AI"}
                        </div>
                        <div
                          className={[
                            "max-w-[75%] rounded-2xl px-4 py-2.5",
                            isUser
                              ? "rounded-tr-sm bg-accent/10 text-primary"
                              : "rounded-tl-sm bg-surface-strong text-primary border border-border",
                          ].join(" ")}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.content}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {msg.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {!conversation && lead.conversationId && (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
                  AI Chat Transcript
                </h2>
                <p className="text-sm text-muted">
                  Conversation record not found (ID: {lead.conversationId}).
                </p>
              </section>
            )}

            {!lead.conversationId && (
              <section className="rounded-2xl border border-border/50 bg-surface/50 p-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">
                  AI Chat Transcript
                </h2>
                <p className="text-sm text-muted">No linked conversation for this lead.</p>
              </section>
            )}
          </div>

          {/* Right column: actions */}
          <div className="space-y-5">

            {/* Update Status */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                Update Status
              </h2>
              <AILeadStatusForm
                leadId={lead.id}
                currentStatus={lead.status}
                locale={locale}
              />
            </section>

            {/* Send Email */}
            {lead.email ? (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                  Send Email
                </h2>
                <AILeadEmailForm
                  leadId={lead.id}
                  toEmail={lead.email}
                  leadName={lead.name}
                  locale={locale}
                />
              </section>
            ) : (
              <section className="rounded-2xl border border-border/50 bg-surface/50 p-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">
                  Send Email
                </h2>
                <p className="text-sm text-muted">No email address on record for this lead.</p>
              </section>
            )}

            {/* Convert to Client */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">
                Convert to Client
              </h2>
              <AILeadConvertForm
                lead={{
                  id: lead.id,
                  name: lead.name,
                  email: lead.email,
                  phone: lead.phone,
                  companyName: lead.companyName,
                  status: lead.status,
                }}
                locale={locale}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
