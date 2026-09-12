"use client";

import {
  Activity,
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Copy,
  Edit2,
  ExternalLink,
  FileText,
  FolderKanban,
  GripVertical,
  Hourglass,
  KanbanSquare,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAdminAction,
  createBoardAction,
  createClientAction,
  createClientFromRequestAction,
  createContentPageAction,
  createConversationAction,
  createNavItemAction,
  createHomepageFaqAction,
  createProjectWithTaskAction,
  createRoleAction,
  createTaskAction,
  convertDemoToProjectAction,
  convertInquiryToProjectAction,
  deleteAdminAction,
  deleteBoardAction,
  deleteContentPageAction,
  deleteNavItemAction,
  deleteHomepageFaqAction,
  deleteRoleAction,
  getWhatsappLinkAction,
  reorderNavItemsAction,
  saveContentTranslationAction,
  sendConversationEmailAction,
  updateAdminAction,
  updateBoardAction,
  updateInquiryNotesAction,
  updateNavItemAction,
  updateHomepageFaqAction,
  updatePageSectionsAction,
  updatePageStatusAction,
  updateRequestStatusAction,
  updateRoleAction,
  updateClientAction,
  deleteClientAction,
  updateProjectAction,
  deleteProjectAction,
  updateCustomerFeedbackAction,
  deleteCustomerFeedbackAction,
  updateDemoDescriptionAction,
  generatePortalAccessAction,
  revokePortalAccessAction,
  sendPortalMessageAction,
  createPortalInvoiceAction,
  createPortalPaymentAction,
  confirmPortalInvoicePaymentAction,
  queryPortalInvoicePaymentAction,
  deletePortalInvoiceAction,
  createPortalRequirementAction,
  markClientPortalThreadsReadAction,
  sendPortalMessageReplyAction,
  reviewPortalFileAction,
  sendPortalInviteEmailAction,
  deleteRequestAction,
  deleteInquiryAction,
} from "@/app/[locale]/admin/actions";
import { AdminKanbanBoard } from "@/components/admin/admin-kanban-board";
import { DatePicker } from "@/components/admin/date-picker";
import { useTheme } from "@/components/theme/theme-provider";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";
import { SECTION_LABELS, createDefaultSection, parseSections, type PageSection, type SectionType } from "@/types/sections";
import type { AdminDashboardData } from "@/lib/admin/dashboard";
import type { Locale } from "@/content/site";

type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  roleLevel: number;
  permissions: string[];
};

type AdminWorkspaceProps = {
  locale: Locale;
  data: AdminDashboardData;
  currentUser: CurrentUser;
};

type SectionKey = "overview" | "clients" | "projects" | "requests" | "content" | "processes" | "access" | "audit";

const statusOptions = ["NEW", "CONTACTED", "DISCOVERY_BOOKED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST", "FOLLOW_UP_LATER"] as const;
const adminStatuses = ["ACTIVE", "INVITED", "DISABLED"] as const;
const clientStatuses = ["PROSPECT", "ONBOARDING", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const projectStatuses = ["PLANNED", "ACTIVE", "REVIEW", "ON_HOLD", "DELIVERED", "ARCHIVED"] as const;
const contentStatuses = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
const processStatuses = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
const feedbackStatuses = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

const labelMap: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DISCOVERY_BOOKED: "Discovery booked",
  PROPOSAL_SENT: "Proposal sent",
  NEGOTIATING: "Negotiating",
  WON: "Won",
  LOST: "Lost",
  FOLLOW_UP_LATER: "Follow up later",
  PROSPECT: "Prospect",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  INVITED: "Invited",
  DISABLED: "Disabled",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
  PLANNED: "Planned",
  REVIEW: "Review",
  ON_HOLD: "On hold",
  DELIVERED: "Delivered",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  PUBLISHED: "Published"
};

const permissionLabels: Record<AdminPermission, string> = {
  "dashboard.view": "Dashboard",
  "roles.manage": "Roles",
  "admins.manage": "Admins",
  "clients.manage": "Clients",
  "projects.manage": "Projects",
  "content.manage": "Content",
  "processes.manage": "Processes",
  "requests.manage": "Requests",
  "settings.manage": "Settings",
  "audit.view": "Audit"
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function compactMoney(value: number | null | undefined) {
  if (!value) return "-";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "danger" | "quiet" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold break-words whitespace-normal",
        tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
        tone === "danger" && "border-red-500/30 bg-red-500/10 text-red-300",
        tone === "quiet" && "border-border bg-background text-muted",
        tone === "default" && "border-cyan-500/30 bg-cyan-500/10 text-accent"
      )}
    >
      {children}
    </span>
  );
}

function statusTone(value: string): "default" | "good" | "warn" | "danger" | "quiet" {
  if (["WON", "DONE", "DELIVERED", "PUBLISHED", "ACTIVE", "COMPLETED"].includes(value)) return "good";
  if (["LOST", "DISABLED", "ARCHIVED"].includes(value)) return "danger";
  if (["URGENT", "HIGH", "ON_HOLD", "PAUSED", "IN_REVIEW", "NEGOTIATING"].includes(value)) return "warn";
  if (["LOW", "DRAFT", "INVITED"].includes(value)) return "quiet";
  return "default";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
      {label}
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("form-input min-w-0 w-full rounded-lg text-sm", props.className)} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("form-input min-h-24 min-w-0 w-full rounded-lg text-sm", props.className)} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("form-input min-w-0 w-full rounded-lg text-sm", props.className)} />;
}

function SubmitButton({ children = "Save" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary justify-center rounded-lg px-4 py-3 text-sm disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      {pending ? "Saving…" : children}
    </button>
  );
}

type ActionFormHandler =
  | ((fd: FormData) => Promise<unknown>)
  | ((_prevState: unknown, fd: FormData) => Promise<unknown>);

function ActionForm({ action, className, successMessage, children }: {
  action: ActionFormHandler;
  className?: string;
  successMessage?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    try {
      if (action.length >= 2) {
        await (action as (_prevState: unknown, fd: FormData) => Promise<unknown>)(null, formData);
      } else {
        await (action as (fd: FormData) => Promise<unknown>)(formData);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form action={handleSubmit} className={className}>
      {children}
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <X className="mt-0.5 size-3 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          <CheckCircle2 className="size-3 shrink-0" />
          <span className="break-words">{successMessage ?? "Saved successfully"}</span>
        </div>
      )}
    </form>
  );
}

function DeletePageButton({ pageId, locale }: { pageId: string; locale: Locale }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("pageId", pageId);
    fd.append("locale", locale);
    try {
      await deleteContentPageAction(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20"
      >
        <Trash2 className="mr-1 inline size-3" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">Delete forever?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 disabled:opacity-60"
      >
        {pending ? <Loader2 className="inline size-3 animate-spin" /> : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => { setConfirming(false); setError(null); }}
        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── Invoice Confirm / Query Widget ─────────────────────────────────────────
// Shown on every AWAITING_CONFIRMATION invoice. Two actions:
//   1. Confirm — marks as PAID and notifies client
//   2. Send query — reverts to SENT, appends a note, notifies client

function InvoiceConfirmWidget({ invoiceId, invoiceTitle }: { invoiceId: string; invoiceTitle: string }) {
  const [mode, setMode] = useState<"idle" | "confirm" | "query">("idle");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("invoiceId", invoiceId);
    const res = await confirmPortalInvoicePaymentAction(fd) as { success: boolean; error?: string };
    if (!res.success) {
      setError(res.error ?? "Something went wrong");
      setPending(false);
    } else {
      setDone(true);
    }
  }

  async function handleQuery() {
    if (!note.trim()) { setError("Please write a note before sending."); return; }
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.append("invoiceId", invoiceId);
    fd.append("note", note.trim());
    const res = await queryPortalInvoicePaymentAction(fd) as { success: boolean; error?: string };
    if (!res.success) {
      setError(res.error ?? "Something went wrong");
      setPending(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="size-3" /> Done
      </span>
    );
  }

  if (mode === "idle") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode("confirm")}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
        >
          <BadgeCheck className="size-3" />
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setMode("query")}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
        >
          <MessageSquare className="size-3" />
          Send query
        </button>
      </div>
    );
  }

  if (mode === "confirm") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted">Confirm receipt of payment?</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60 transition"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : <BadgeCheck className="size-3" />}
          {pending ? "Confirming…" : "Yes, confirm"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("idle"); setError(null); }}
          className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted hover:bg-surface transition"
        >
          Cancel
        </button>
        {error && <span className="w-full text-[11px] text-red-400 mt-1">{error}</span>}
      </div>
    );
  }

  // mode === "query"
  return (
    <div className="mt-2 w-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="size-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] font-semibold text-amber-300">Send payment query to client</p>
      </div>
      <p className="text-[11px] text-slate-400">
        The invoice will revert to <strong className="text-slate-300">Sent</strong>. The client will receive a notification with your note and can re-submit their payment evidence.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`e.g. We haven't received the payment for "${invoiceTitle}" yet. Please check your bank statement or re-send your proof of payment.`}
        rows={3}
        className="w-full rounded-md border border-amber-500/20 bg-background px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleQuery}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-60 transition"
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          {pending ? "Sending…" : "Send query & revert"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("idle"); setNote(""); setError(null); }}
          className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted hover:bg-surface transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Panel({ title, eyebrow, action, children }: { title: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</p> : null}
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: typeof LayoutDashboard }) {
  return (
    <article className="min-w-0 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 break-words text-3xl font-semibold text-primary">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted">{detail}</p>
    </article>
  );
}

function StatusForm({ locale, id, type, status, notes }: { locale: Locale; id: string; type: "lead" | "contact" | "demo"; status: string; notes?: string | null }) {
  return (
    <form action={updateRequestStatusAction} className="mt-3 grid gap-3 rounded-lg border border-border bg-background p-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="type" value={type} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <Field label="Status">
          <Select name="status" defaultValue={status}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {labelMap[option]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Internal notes">
          <Input name="notes" defaultValue={notes || ""} placeholder="Next step, blocker, context" />
        </Field>
        <button className="self-end rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary max-sm:w-full" type="submit">
          Update
        </button>
      </div>
    </form>
  );
}

function EmptyState({ title }: { title: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted">{title}</p>;
}

const VALID_SECTIONS: SectionKey[] = ["overview", "clients", "projects", "requests", "content", "processes", "access", "audit"];

export function AdminWorkspace({ locale, data, currentUser }: AdminWorkspaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const rawSection = searchParams.get("section") as SectionKey | null;
  const active: SectionKey = rawSection && VALID_SECTIONS.includes(rawSection) ? rawSection : "overview";

  const can = useCallback((permission: AdminPermission) => currentUser.roleLevel >= 100 || (currentUser.permissions ?? []).includes(permission), [currentUser.permissions, currentUser.roleLevel]);

  const navItems = useMemo(
    () =>
      [
        { key: "overview", label: "Command", icon: LayoutDashboard, permission: "dashboard.view" },
        { key: "clients", label: "Clients", icon: BriefcaseBusiness, permission: "clients.manage" },
        { key: "projects", label: "Projects", icon: ClipboardList, permission: "projects.manage" },
        { key: "requests", label: "Requests", icon: Activity, permission: "requests.manage" },
        { key: "content", label: "Content", icon: FileText, permission: "content.manage" },
        { key: "processes", label: "Processes", icon: KanbanSquare, permission: "dashboard.view" },
        { key: "access", label: "Access", icon: ShieldCheck, permission: "admins.manage" },
        { key: "audit", label: "Audit", icon: BookOpenText, permission: "audit.view" }
      ].filter((item) => can(item.permission as AdminPermission)),
    [can]
  );

  const aiLinks = useMemo(
    () => [
      {
        href: "/admin/ai-conversations",
        label: "AI Conversations",
        description: "Review visitor chat sessions",
        icon: MessageCircle,
      },
      {
        href: "/admin/ai-leads",
        label: "AI Leads",
        description: "Track captured AI prospects",
        icon: UserPlus,
      },
      {
        href: "/admin/ai-usage",
        label: "AI Usage",
        description: "Monitor tokens and cost",
        icon: Activity,
      },
    ],
    []
  );

  const assignableRoles = data.roles.filter((role) => currentUser.roleLevel >= 100 || role.level < currentUser.roleLevel);
  function chooseSection(next: SectionKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("section");
    } else {
      params.set("section", next);
    }
    router.push(`?${params.toString()}`, { scroll: false });
    setMenuOpen(false);
  }

  const sidebar = (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-accent/10 text-accent">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary">teChia Admin</p>
            <p className="truncate text-xs text-muted">{currentUser.email}</p>
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseSection(item.key as SectionKey)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition",
                  active === item.key ? "bg-accent text-[#001018]" : "text-muted hover:bg-background hover:text-primary"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <ChevronRight className="size-4 shrink-0" />
              </button>
            );
          })}
        </div>
        {can("requests.manage") ? (
          <div className="mt-5 grid gap-2 border-t border-border pt-4">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Academy
            </p>
            <Link
              href="/admin/bonus-claims"
              className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-background"
            >
              <span className="flex min-w-0 items-start gap-3">
                <BookOpenText className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-primary">
                    Bonus Claims
                  </span>
                  <span className="mt-0.5 block break-words text-xs text-muted">
                    Verify buyer proof and send the full bonus bundle
                  </span>
                </span>
              </span>
              <Pill tone="default">{data.stats.pendingBonusClaims}</Pill>
            </Link>
          </div>
        ) : null}
        {can("dashboard.view") ? (
          <div className="mt-5 grid gap-2 border-t border-border pt-4">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              AI
            </p>
            {aiLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-background"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-primary">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block break-words text-xs text-muted">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted" />
                </a>
              );
            })}
          </div>
        ) : null}
      </nav>
      <div className="grid gap-2 border-t border-border p-3">
        <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-primary" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-primary" type="button" onClick={() => signOut({ callbackUrl: "/admin" })}>
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <main className="min-h-dvh overflow-hidden bg-background text-primary">
      <div className="grid h-dvh min-h-dvh min-w-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 lg:block">{sidebar}</div>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-primary/35 backdrop-blur-md" type="button" aria-label="Close admin menu" onClick={() => setMenuOpen(false)} />
            <div className="relative h-full w-[min(18rem,calc(100vw-0.75rem))] overflow-hidden shadow-2xl">{sidebar}</div>
            <button
              className="absolute right-4 top-4 grid size-12 place-items-center rounded-full border border-accent/50 bg-background/80 text-primary shadow-glow backdrop-blur-xl"
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMenuOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="grid size-10 place-items-center rounded-lg border border-border bg-background lg:hidden" type="button" aria-label="Open admin menu" onClick={() => setMenuOpen(true)}>
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                  <button
                    type="button"
                    onClick={() => chooseSection("overview")}
                    className="shrink-0 font-semibold uppercase tracking-[0.14em] text-accent hover:underline"
                  >
                    Admin
                  </button>
                  {active !== "overview" && (
                    <>
                      <ChevronRight className="size-3 shrink-0 text-muted" />
                      <span className="truncate font-medium text-primary">
                        {navItems.find((item) => item.key === active)?.label || "Command"}
                      </span>
                    </>
                  )}
                </nav>
                <h1 className="truncate text-lg font-semibold text-primary md:text-xl">{navItems.find((item) => item.key === active)?.label || "Command"}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Pill tone="quiet">{(currentUser.role ?? "admin").replace(/_/g, " ")}</Pill>
              <Pill tone="good">Secure session</Pill>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <div className="mx-auto w-full max-w-[120rem]">
              {active === "overview" ? <Overview data={data} can={can} /> : null}
              {active === "clients" && can("clients.manage") ? <Clients data={data} locale={locale} /> : null}
              {active === "projects" && can("projects.manage") ? <Projects data={data} locale={locale} /> : null}
              {active === "requests" && can("requests.manage") ? <Requests data={data} locale={locale} /> : null}
              {active === "content" && can("content.manage") ? <Content data={data} locale={locale} /> : null}
              {active === "processes" ? <Processes data={data} locale={locale} currentUser={currentUser} canManage={can("processes.manage")} /> : null}
              {active === "access" && can("admins.manage") ? <Access data={data} locale={locale} roles={assignableRoles} currentUser={currentUser} canManageRoles={can("roles.manage")} /> : null}
              {active === "audit" && can("audit.view") ? <Audit data={data} /> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Overview({ data, can }: { data: AdminDashboardData; can: (permission: AdminPermission) => boolean }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 min-[420px]:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Users} label="Clients" value={data.stats.clients} detail="Accounts in CRM" />
        <MetricCard icon={ClipboardList} label="Active projects" value={data.stats.activeProjects} detail="Planned, active, or review" />
        <MetricCard icon={Activity} label="Inbound" value={data.stats.leads + data.stats.contacts + data.stats.demos} detail="Leads, contacts, demos" />
        <MetricCard icon={FileText} label="Pages" value={data.stats.pages} detail="Managed content records" />
        <MetricCard icon={ShieldCheck} label="Admins" value={data.stats.admins} detail="Database-backed users" />
        <MetricCard icon={BookOpenText} label="Bonus claims" value={data.stats.pendingBonusClaims} detail="Academy claims awaiting closure" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        {can("requests.manage") ? (
          <Panel title="Pipeline Snapshot" eyebrow="Requests">
            <div className="grid gap-3 md:grid-cols-3">
              {(["lead", "contact", "demo"] as const).map((type) => (
                <div key={type} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-semibold capitalize text-primary">{type}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <Pill key={status} tone={statusTone(status)}>
                        {labelMap[status]}: {data.statusCounts[type][status]}
                      </Pill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        <Panel title="Recent Audit" eyebrow="Control">
          <div className="grid gap-3">
            {data.auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-semibold text-primary">{log.action}</p>
                <p className="text-xs text-muted">{log.actor} · {formatDate(log.createdAt)}</p>
              </div>
            ))}
            {!data.auditLogs.length ? <EmptyState title="No audit events yet." /> : null}
          </div>
        </Panel>
      </div>

      {can("dashboard.view") ? (
        <Panel title="AI Dashboards" eyebrow="Tools">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                href: "/admin/ai-conversations",
                label: "AI Conversations",
                description: "Inspect chat sessions, message counts, and conversation status.",
                icon: MessageCircle,
              },
              {
                href: "/admin/ai-leads",
                label: "AI Leads",
                description: "See leads captured by the public AI consultant and review follow-up quality.",
                icon: UserPlus,
              },
              {
                href: "/admin/ai-usage",
                label: "AI Usage",
                description: "Monitor request volume, token usage, and estimated AI cost.",
                icon: Activity,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-border bg-background p-4 transition hover:border-accent/40 hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="size-5" />
                    </div>
                    <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-primary">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                </a>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {can("requests.manage") ? (
        <Panel title="Academy Operations" eyebrow="Courses">
          <Link
            href="/admin/bonus-claims"
            className="group flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition hover:border-accent/40 hover:bg-surface"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                <BookOpenText className="size-5" />
              </div>
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted transition group-hover:text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary">Academy Bonus Claims</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Review buyer proof, verify official pack purchases, and deliver the requested bonus files from one admin queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="default">{data.stats.pendingBonusClaims} open</Pill>
              <Pill tone="quiet">{data.stats.bonusClaims} total</Pill>
            </div>
          </Link>
        </Panel>
      ) : null}

      {can("clients.manage") ? (
        <Panel title="High Priority Clients" eyebrow="CRM">
          <div className="grid gap-3 min-[540px]:grid-cols-2 2xl:grid-cols-3">
            {data.clients.slice(0, 6).map((client) => (
              <article key={client.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-primary">{client.name}</h3>
                    <p className="break-words text-sm text-muted">{client.industry || "Industry not set"}</p>
                  </div>
                  <Pill tone={statusTone(client.priority)}>{labelMap[client.priority]}</Pill>
                </div>
                <p className="mt-3 text-xs text-muted">Owner: {client.owner?.name || client.owner?.email || "Unassigned"}</p>
              </article>
            ))}
            {!data.clients.length ? <EmptyState title="Create your first client record." /> : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function Clients({ data, locale }: { data: AdminDashboardData; locale: Locale }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const selectedClient = selectedClientId ? (data.clients.find((c) => c.id === selectedClientId) ?? null) : null;
  const clientProjects = selectedClient ? data.projects.filter((p) => p.clientId === selectedClient.id) : [];
  const totalUnreadPortal = useMemo(() => {
    return data.clients.reduce((sum, client) => sum + getClientPortalUnreadCount(client), 0);
  }, [data.clients]);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <Panel title="Create Client" eyebrow="CRM">
          <form action={createClientAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <Field label="Client name"><Input name="name" required placeholder="Acme Logistics" /></Field>
            <Field label="Industry"><Input name="industry" placeholder="Logistics, education, travel" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status"><Select name="status" defaultValue="PROSPECT">{clientStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
              <Field label="Priority"><Select name="priority" defaultValue="MEDIUM">{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
            </div>
            <Field label="Primary contact"><Input name="contactName" placeholder="Contact person" /></Field>
            <Field label="Contact role"><Input name="contactRole" placeholder="CEO, Operations, Marketing" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email"><Input name="email" type="email" placeholder="client@example.com" /></Field>
              <Field label="Phone"><Input name="phone" placeholder="+237 ..." /></Field>
            </div>
            <Field label="Website"><Input name="website" type="url" placeholder="https://example.com" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Country"><Input name="country" placeholder="Cameroon" /></Field>
              <Field label="City"><Input name="city" placeholder="Douala" /></Field>
            </div>
            <Field label="Estimated value"><Input name="estimatedValue" type="number" min={0} placeholder="2500000" /></Field>
            <Field label="Tags"><Input name="tags" placeholder="seo, portal, priority" /></Field>
            <Field label="Notes"><Textarea name="notes" placeholder="Commercial context, risks, next action" /></Field>
            <SubmitButton>Create client</SubmitButton>
          </form>
        </Panel>

        <Panel title="Client Portfolio" eyebrow="Accounts">
          {totalUnreadPortal > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
              <MessageCircle className="size-3.5" />
              {totalUnreadPortal} unread client portal response{totalUnreadPortal !== 1 ? "s" : ""}
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {data.clients.map((client) => {
              const unreadPortal = getClientPortalUnreadCount(client);
              return (
                <article key={client.id} className="rounded-lg border border-border bg-background p-4">
                  {unreadPortal > 0 && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                      <MessageCircle className="size-3" />
                      {unreadPortal} unread
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold text-primary">{client.name}</h3>
                      <p className="break-words text-sm text-muted">{client.industry || "No industry"} · {client.country || "No country"}</p>
                    </div>
                    <Pill tone={statusTone(client.status)}>{labelMap[client.status]}</Pill>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted">
                    <p>Contact: {client.contactName || client.contacts[0]?.name || "-"}</p>
                    <p>Email: {client.email || client.contacts[0]?.email || "-"}</p>
                    <p>Owner: {client.owner?.name || client.owner?.email || "Unassigned"}</p>
                    <p>Value: {compactMoney(client.estimatedValue)}</p>
                  </div>
                  <div className="mt-4 flex min-w-0 flex-wrap items-center gap-1.5">
                    <Pill tone={statusTone(client.priority)}>{labelMap[client.priority]}</Pill>
                    {client.tags.slice(0, 2).map((tag) => (
                      <Pill key={tag} tone="quiet">{tag}</Pill>
                    ))}
                    {client.tags.length > 2 && (
                      <Pill tone="quiet">+{client.tags.length - 2}</Pill>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {client.projects.slice(0, 2).map((project) => (
                      <div key={project.id} className="overflow-hidden rounded-lg border border-border bg-surface p-3 text-sm">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 break-words font-semibold text-primary">{project.title}</span>
                          <span className="shrink-0 text-xs text-muted">{project.progress}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    ))}
                    {client.projects.length > 2 && (
                      <p className="text-xs text-muted">+{client.projects.length - 2} more project{client.projects.length - 2 !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted transition hover:bg-background hover:text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                    View Details
                    {unreadPortal > 0 && (
                      <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                        {unreadPortal}
                      </span>
                    )}
                  </button>
                </article>
              );
            })}
            {!data.clients.length ? <EmptyState title="No clients yet." /> : null}
          </div>
        </Panel>
      </div>

      {selectedClient && (
        <ClientDetailDrawer
          client={selectedClient}
          projects={clientProjects}
          locale={locale}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </>
  );
}

type ClientRecord = AdminDashboardData["clients"][0];
type ProjectRecord = AdminDashboardData["projects"][0];

function getClientPortalUnreadCount(client: ClientRecord): number {
  const unreadInitialMessages = (client.portalMessages || []).filter((message) => !message.fromAdmin && !message.readAt).length;
  const unreadReplies = (client.portalMessages || []).reduce((total, message) => {
    return total + (message.replies || []).filter((reply) => !reply.fromAdmin && !reply.readAt).length;
  }, 0);
  return unreadInitialMessages + unreadReplies;
}

// ─── Client Portal Management Component ─────────────────────────────────────

function PortalAccessCard({ client }: { client: ClientRecord }) {
  const [genState, genAction, genPending] = useActionState(generatePortalAccessAction, null);
  const [revokeState, revokeAction, revokePending] = useActionState(revokePortalAccessAction, null);
  const [emailState, emailAction, emailPending] = useActionState(sendPortalInviteEmailAction, null);
  const [copied, setCopied] = useState(false);

  // Active code = freshly generated (from state) OR persisted in DB
  const freshCode = genState?.success ? genState.code : null;
  const persistedAccess = client.portalAccess?.isActive ? client.portalAccess : null;
  const activeCode = freshCode ?? persistedAccess?.code ?? null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://techia.ca";
  const loginUrl = `${origin}/client-portal/login`;

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp(code: string) {
    const phone = (client.phone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hello ${client.contactName || client.name},\n\nYour teChia Client Portal is ready!\n\n📧 Email: ${client.email || "your registered email"}\n🔑 Access code: ${code}\n🔗 Login: ${loginUrl}\n\nYour portal gives you real-time visibility into your projects, file deliveries, invoices, and direct communication with our team.\n\nWelcome aboard!\n— The teChia Team`
    );
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  }

  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Portal Access</h3>
      <div className="rounded-lg border border-border bg-background p-4 text-sm grid gap-4">
        {/* Status row */}
        {!activeCode && !freshCode && (
          <p className="text-muted text-sm">
            No active portal access for <span className="font-semibold text-primary">{client.name}</span>. Generate a code to invite them.
          </p>
        )}

        {/* Active code display */}
        {activeCode && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-4 grid gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  {freshCode ? "Code generated" : "Active access code"}
                </p>
                {persistedAccess?.lastUsedAt && !freshCode && (
                  <p className="text-xs text-muted">Last used: {new Date(persistedAccess.lastUsedAt).toLocaleDateString()}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => copy(activeCode)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
              >
                {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="break-all rounded-lg bg-black/30 px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.22em] text-emerald-300 sm:text-2xl sm:tracking-[0.35em]">
              {activeCode}
            </div>

            {/* Login URL */}
            <div className="flex items-start gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
              <ExternalLink className="size-3 shrink-0 text-slate-500" />
              <span className="break-all">{loginUrl}</span>
            </div>

            {/* Invite actions */}
            <div className="grid gap-2">
              {/* Email via Resend */}
              <form action={emailAction} className="contents">
                <input type="hidden" name="toEmail" value={client.email ?? ""} />
                <input type="hidden" name="toName" value={client.contactName || client.name} />
                <input type="hidden" name="accessCode" value={activeCode} />
                <input type="hidden" name="loginUrl" value={loginUrl} />
                <button
                  type="submit"
                  disabled={emailPending || !client.email}
                  title={!client.email ? "No email on file for this client" : undefined}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/8 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailPending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  {emailPending ? "Sending email…" : "Send invite via email"}
                </button>
              </form>
              {emailState?.error && <p className="text-xs text-red-400">{emailState.error}</p>}
              {emailState?.success && <p className="text-xs text-emerald-400">Invite email sent successfully.</p>}

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => openWhatsApp(activeCode)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/8 px-3 py-2 text-xs font-semibold text-green-400 transition hover:bg-green-500/15"
              >
                <Phone className="size-3.5" />
                Send via WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Generate / Revoke buttons */}
        <div className="flex flex-wrap gap-2">
          <form action={genAction} className="max-sm:w-full">
            <input type="hidden" name="clientId" value={client.id} />
            <button
              type="submit"
              disabled={genPending}
              className="flex items-center gap-2 rounded-lg btn-primary px-3 py-2 text-xs font-semibold disabled:opacity-60 max-sm:w-full max-sm:justify-center"
            >
              {genPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              {genPending ? "Generating…" : activeCode ? "Regenerate code" : "Generate access code"}
            </button>
          </form>

          {activeCode && (
            <form action={revokeAction} className="max-sm:w-full">
              <input type="hidden" name="clientId" value={client.id} />
              <button
                type="submit"
                disabled={revokePending}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-60 max-sm:w-full max-sm:justify-center"
              >
                {revokePending ? <Loader2 className="size-3.5 animate-spin" /> : <LockKeyhole className="size-3.5" />}
                Revoke access
              </button>
            </form>
          )}
        </div>

        {genState?.error && <p className="text-xs text-red-400">{genState.error}</p>}
        {revokeState?.success && <p className="text-xs text-amber-400">Portal access revoked. Client can no longer log in.</p>}
        {revokeState?.error && <p className="text-xs text-red-400">{revokeState.error}</p>}
      </div>
    </section>
  );
}

function ClientPortalManagement({ client, projects }: { client: ClientRecord; projects: ProjectRecord[] }) {
  const [msgState, msgAction, msgPending] = useActionState(sendPortalMessageAction, null);
  const [invState, invAction, invPending] = useActionState(createPortalInvoiceAction, null);
  const [reqState, reqAction, reqPending] = useActionState(createPortalRequirementAction, null);
  const [pmtState, pmtAction, pmtPending] = useActionState(createPortalPaymentAction, null);
  const [uploadFilter, setUploadFilter] = useState<"ALL" | "PENDING">("ALL");
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);
  const sortedThreads = [...(client.portalMessages || [])].sort((a, b) => {
    const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTs - aTs;
  });
  const submittedRequirements = (client.portalRequirements || [])
    .filter((item) => item.status === "SUBMITTED" || item.response || item.fileUrl || item.submittedAt)
    .sort((a, b) => {
      const aTs = new Date(a.submittedAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTs = new Date(b.submittedAt || b.updatedAt || b.createdAt || 0).getTime();
      return bTs - aTs;
    });
  const unreadInThreads = sortedThreads.reduce((total, thread) => {
    const threadUnreadStarter = !thread.fromAdmin && !thread.readAt ? 1 : 0;
    const unreadReplies = (thread.replies || []).filter((reply) => !reply.fromAdmin && !reply.readAt).length;
    return total + threadUnreadStarter + unreadReplies;
  }, 0);
  const portalFiles = client.portalFiles || [];
  const pendingPortalFiles = portalFiles.filter((file) => file.status === "PENDING");
  const filteredPortalFiles = uploadFilter === "PENDING" ? pendingPortalFiles : portalFiles;
  const portalPayments = client.portalPayments || [];
  const standaloneInvoices = client.standaloneInvoices || [];
  const awaitingConfirmation = [
    ...portalPayments.flatMap((p) => p.invoices.filter((i) => i.status === "AWAITING_CONFIRMATION")),
    ...standaloneInvoices.filter((i) => i.status === "AWAITING_CONFIRMATION"),
  ];

  const paymentStatusMap: Record<string, { label: string; color: string }> = {
    ACTIVE:    { label: "Active",    color: "text-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/20" },
    COMPLETED: { label: "Completed", color: "text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20" },
    CANCELLED: { label: "Cancelled", color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" },
  };
  const invoiceStatusMap: Record<string, { label: string; color: string }> = {
    DRAFT:                 { label: "Draft",               color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" },
    SENT:                  { label: "Sent",                color: "text-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/20" },
    AWAITING_CONFIRMATION: { label: "Awaiting Confirm.",   color: "text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/20" },
    PAID:                  { label: "Paid",                color: "text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20" },
    OVERDUE:               { label: "Overdue",             color: "text-red-400 bg-red-400/10 ring-1 ring-red-400/20" },
    CANCELLED:             { label: "Cancelled",           color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" },
  };

  const fmt = (cents: number, currency: string) =>
    new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(cents / 100);

  return (
    <div className="grid gap-6">
      {/* Access Card */}
      <PortalAccessCard client={client} />

      {/* ─── Payment Plans ─── */}
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Payment Plans</h3>
          {awaitingConfirmation.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
              <Hourglass className="size-3" />
              {awaitingConfirmation.length} awaiting confirmation
            </span>
          )}
        </div>

        {/* Existing payment plans */}
        {portalPayments.length > 0 && (
          <div className="grid gap-3">
            {portalPayments.map((payment) => {
              const pct = payment.totalAmount > 0
                ? Math.min(100, Math.round((payment.paidAmount / payment.totalAmount) * 100))
                : 0;
              const pmtStatus = paymentStatusMap[payment.status] ?? { label: payment.status, color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" };
              const isOpen = openPaymentId === payment.id;
              const awaitingInvoices = payment.invoices.filter((i) => i.status === "AWAITING_CONFIRMATION");
              return (
                <article key={payment.id} className="rounded-lg border border-border bg-background overflow-hidden">
                  {/* Header */}
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
                    onClick={() => setOpenPaymentId(isOpen ? null : payment.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pmtStatus.color}`}>
                          {pmtStatus.label}
                        </span>
                        {awaitingInvoices.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            <Hourglass className="size-2.5" />
                            {awaitingInvoices.length} to confirm
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-primary">{payment.title}</p>
                      {payment.projects.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted">
                          {payment.projects.map((p) => p.title).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-bold text-primary">{fmt(payment.totalAmount, payment.currency)}</p>
                      <p className="text-[11px] text-muted">
                        Remaining: <span className="font-semibold text-amber-400">{fmt(payment.remainingAmount, payment.currency)}</span>
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="mt-1 size-4 text-muted shrink-0" /> : <ChevronDown className="mt-1 size-4 text-muted shrink-0" />}
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-border px-4 pb-4 pt-3 grid gap-4">
                      {/* Progress */}
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">Progress</span>
                          <span className="font-semibold text-primary">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full transition-all ${payment.status === "COMPLETED" ? "bg-emerald-500" : "bg-cyan-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
                            <p className="text-muted">Total</p>
                            <p className="mt-0.5 font-semibold text-primary">{fmt(payment.totalAmount, payment.currency)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
                            <p className="text-muted">Paid</p>
                            <p className="mt-0.5 font-semibold text-emerald-400">{fmt(payment.paidAmount, payment.currency)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
                            <p className="text-muted">Remaining</p>
                            <p className="mt-0.5 font-semibold text-amber-400">{fmt(payment.remainingAmount, payment.currency)}</p>
                          </div>
                        </div>
                        {payment.initialPayment > 0 && (
                          <p className="text-[11px] text-muted">
                            Initial deposit: <span className="text-slate-300">{fmt(payment.initialPayment, payment.currency)}</span>
                          </p>
                        )}
                      </div>

                      {/* Invoices list */}
                      {payment.invoices.length > 0 && (
                        <div className="grid gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Invoices</p>
                          <div className="grid gap-2">
                            {payment.invoices.map((inv) => {
                              const invStatus = invoiceStatusMap[inv.status] ?? { label: inv.status, color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" };
                              return (
                                <div key={inv.id} className="rounded-lg border border-border bg-surface px-3 py-2.5 space-y-2">
                                  {/* Top row: info + amount */}
                                  <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${invStatus.color}`}>
                                          {invStatus.label}
                                        </span>
                                        <span className="text-[11px] text-muted">{inv.invoiceNumber}</span>
                                      </div>
                                      <p className="mt-0.5 text-xs font-medium text-primary">{inv.title}</p>
                                      {inv.dueDate && (
                                        <p className="text-[10px] text-muted">Due {formatDate(inv.dueDate)}</p>
                                      )}
                                      {inv.confirmedAt && (
                                        <p className="text-[10px] text-emerald-400">Confirmed {formatDate(inv.confirmedAt)}</p>
                                      )}
                                      {inv.notes && (
                                        <p className={`mt-1 text-[10px] whitespace-pre-wrap leading-relaxed ${inv.notes.includes("⚠️ Payment query") ? "text-amber-300/80" : "text-muted"}`}>
                                          {inv.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <span className="text-sm font-bold text-primary">{fmt(inv.amount, inv.currency)}</span>
                                      {inv.status !== "PAID" && inv.status !== "AWAITING_CONFIRMATION" && (
                                        <form action={async (fd) => { await deletePortalInvoiceAction(fd); }} onSubmit={(e) => { if (!confirm(`Delete invoice "${inv.title}"?`)) e.preventDefault(); }}>
                                          <input type="hidden" name="invoiceId" value={inv.id} />
                                          <button type="submit" className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/15 transition">
                                            <Trash2 className="size-3" />
                                          </button>
                                        </form>
                                      )}
                                    </div>
                                  </div>
                                  {/* Proof of payment link */}
                                  {inv.proofOfPaymentUrl && (
                                    <a
                                      href={`/api/admin/portal-proof?invoiceId=${inv.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition"
                                    >
                                      <ExternalLink className="size-3" />
                                      View proof of payment{inv.proofOfPaymentName ? ` — ${inv.proofOfPaymentName}` : ""}
                                    </a>
                                  )}
                                  {/* Full-width confirm widget */}
                                  {inv.status === "AWAITING_CONFIRMATION" && (
                                    <InvoiceConfirmWidget invoiceId={inv.id} invoiceTitle={inv.title} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {payment.notes && (
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Notes</p>
                          <p className="mt-1 text-sm text-slate-400 whitespace-pre-wrap">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Create Payment Plan form */}
        <form action={pmtAction} className="grid gap-3 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Plus className="size-3" /> Create Payment Plan
          </div>
          <input type="hidden" name="clientId" value={client.id} />
          <Field label="Title"><Input name="title" required placeholder="Website Redesign — Full Project" /></Field>
          <Field label="Description (optional)"><Textarea name="description" placeholder="Agreed scope and deliverables…" rows={2} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Total agreed amount">
              <Input name="totalAmount" required type="number" step="0.01" min="0.01" placeholder="5000.00" />
            </Field>
            <Field label="Initial deposit already paid">
              <Input name="initialPayment" type="number" step="0.01" min="0" defaultValue="0" placeholder="0.00" />
            </Field>
            <Field label="Currency">
              <Select name="currency" defaultValue="USD">
                {["USD", "EUR", "GBP", "CAD", "AUD", "MAD", "XAF"].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          {projects.length > 0 && (
            <Field label="Linked projects (hold Ctrl/Cmd to select multiple)">
              <select
                name="projectIds"
                multiple
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                style={{ height: Math.min(projects.length, 4) * 36 + 16 }}
              >
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notes (optional)"><Textarea name="notes" placeholder="Payment terms, bank details, conditions…" /></Field>
          <button type="submit" disabled={pmtPending} className="btn-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {pmtPending ? <Loader2 className="size-3.5 animate-spin" /> : <Wallet className="size-3.5" />}
            {pmtPending ? "Creating…" : "Create payment plan"}
          </button>
          {pmtState?.error && <p className="text-xs text-red-400">{pmtState.error}</p>}
          {pmtState?.success && <p className="text-xs text-emerald-400">Payment plan created and visible in client portal.</p>}
        </form>
      </section>

      {/* ─── Standalone Invoices ─── */}
      {standaloneInvoices.length > 0 && (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Standalone Invoices</h3>
            {standaloneInvoices.some((i) => i.status === "AWAITING_CONFIRMATION") && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                <Hourglass className="size-3" />
                {standaloneInvoices.filter((i) => i.status === "AWAITING_CONFIRMATION").length} awaiting confirmation
              </span>
            )}
          </div>
          <div className="grid gap-2">
            {standaloneInvoices.map((inv) => {
              const invStatus = invoiceStatusMap[inv.status] ?? { label: inv.status, color: "text-slate-400 bg-slate-400/10 ring-1 ring-slate-400/20" };
              const canDelete = inv.status !== "PAID" && inv.status !== "AWAITING_CONFIRMATION";
              return (
                 <article key={inv.id} className={`rounded-lg border bg-background px-4 py-3 space-y-2.5 ${inv.status === "AWAITING_CONFIRMATION" ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}>
                   {/* Top row */}
                   <div className="flex min-w-0 items-start justify-between gap-3">
                     <div className="min-w-0 flex-1">
                       <div className="flex flex-wrap items-center gap-2">
                         <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${invStatus.color}`}>
                           {inv.status === "AWAITING_CONFIRMATION" && <Hourglass className="size-2.5" />}
                           {invStatus.label}
                         </span>
                         <span className="text-[11px] text-muted">{inv.invoiceNumber}</span>
                       </div>
                       <p className="mt-0.5 text-sm font-medium text-primary">{inv.title}</p>
                       <div className="flex flex-wrap items-center gap-3 mt-0.5">
                         {inv.dueDate && <p className="text-[11px] text-muted">Due {formatDate(inv.dueDate)}</p>}
                         {inv.confirmedAt && <p className="text-[11px] text-emerald-400">Confirmed {formatDate(inv.confirmedAt)}</p>}
                       </div>
                       {inv.notes && (
                         <p className={`mt-1 text-[11px] whitespace-pre-wrap leading-relaxed ${inv.notes.includes("⚠️ Payment query") ? "text-amber-300/80" : "text-muted"}`}>
                           {inv.notes}
                         </p>
                       )}
                     </div>
                     <div className="flex shrink-0 items-center gap-2">
                       <span className="text-sm font-bold text-primary">{fmt(inv.amount, inv.currency)}</span>
                       {canDelete && (
                         <form action={async (fd) => { await deletePortalInvoiceAction(fd); }} onSubmit={(e) => { if (!confirm(`Delete invoice "${inv.title}"? This cannot be undone.`)) e.preventDefault(); }}>
                           <input type="hidden" name="invoiceId" value={inv.id} />
                           <button
                             type="submit"
                             className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/15 transition"
                           >
                             <Trash2 className="size-3" />
                           </button>
                         </form>
                       )}
                     </div>
                   </div>
                   {/* Proof of payment link */}
                   {inv.proofOfPaymentUrl && (
                     <a
                       href={`/api/admin/portal-proof?invoiceId=${inv.id}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition"
                     >
                       <ExternalLink className="size-3" />
                       View proof of payment{inv.proofOfPaymentName ? ` — ${inv.proofOfPaymentName}` : ""}
                     </a>
                   )}
                   {/* Full-width confirm widget */}
                   {inv.status === "AWAITING_CONFIRMATION" && (
                     <InvoiceConfirmWidget invoiceId={inv.id} invoiceTitle={inv.title} />
                   )}
                 </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Send Message */}
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Send Message</h3>
        <form action={msgAction} className="grid gap-3 rounded-lg border border-border bg-background p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label="Subject"><Input name="subject" required placeholder="Project update, milestone reached…" /></Field>
          <Field label="Message"><Textarea name="body" required placeholder="Write your message to the client…" rows={4} /></Field>
          <button type="submit" disabled={msgPending} className="btn-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {msgPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            {msgPending ? "Sending…" : "Send message"}
          </button>
          {msgState?.error && <p className="text-xs text-red-400">{msgState.error}</p>}
          {msgState?.success && <p className="text-xs text-emerald-400">Message sent to client portal.</p>}
        </form>
      </section>

      {/* Create Invoice */}
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Create Invoice</h3>
        <form action={invAction} className="grid gap-3 rounded-lg border border-border bg-background p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label="Title"><Input name="title" required placeholder="Website design — Phase 1" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount (USD, e.g. 1500.00)"><Input name="amount" required type="number" step="0.01" min="0.01" placeholder="1500.00" /></Field>
            <Field label="Currency">
              <Select name="currency" defaultValue="USD">
                {["USD", "EUR", "GBP", "CAD", "AUD", "MAD", "XAF"].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Due date"><DatePicker name="dueDate" /></Field>
            {projects.length > 0 && (
              <Field label="Link to project">
                <Select name="projectId">
                  <option value="">— None —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </Select>
              </Field>
            )}
          </div>
          {portalPayments.length > 0 && (
            <Field label="Link to payment plan (optional)">
              <Select name="paymentId">
                <option value="">— None (standalone invoice) —</option>
                {portalPayments.map((pay) => (
                  <option key={pay.id} value={pay.id}>
                    {pay.title} ({fmt(pay.remainingAmount, pay.currency)} remaining)
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Notes (optional)"><Textarea name="notes" placeholder="Payment instructions, terms…" /></Field>
          <button type="submit" disabled={invPending} className="btn-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {invPending ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
            {invPending ? "Creating…" : "Create invoice"}
          </button>
          {invState?.error && <p className="text-xs text-red-400">{invState.error}</p>}
          {invState?.success && <p className="text-xs text-emerald-400">Invoice created and sent to client portal.</p>}
        </form>
      </section>

      {/* Request from Client */}
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Request from Client</h3>
        <form action={reqAction} className="grid gap-3 rounded-lg border border-border bg-background p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <Field label="Title"><Input name="title" required placeholder="Send brand assets, Approve design mockup…" /></Field>
          <Field label="Description"><Textarea name="description" required placeholder="What exactly do you need from the client?" rows={3} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select name="type" defaultValue="INFORMATION">
                {[
                  ["CONTENT", "Content"],
                  ["APPROVAL", "Approval"],
                  ["DOCUMENT", "Document"],
                  ["INFORMATION", "Information"],
                  ["FEEDBACK", "Feedback"],
                  ["OTHER", "Other"],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Due date (optional)"><DatePicker name="dueDate" /></Field>
          </div>
          {projects.length > 0 && (
            <Field label="Link to project">
              <Select name="projectId">
                <option value="">— None —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
            </Field>
          )}
          <button type="submit" disabled={reqPending} className="btn-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {reqPending ? <Loader2 className="size-3.5 animate-spin" /> : <ClipboardList className="size-3.5" />}
            {reqPending ? "Sending…" : "Send request"}
          </button>
          {reqState?.error && <p className="text-xs text-red-400">{reqState.error}</p>}
          {reqState?.success && <p className="text-xs text-emerald-400">Request sent to client portal.</p>}
        </form>
      </section>

      {/* Conversation Thread History */}
      <section className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Portal Conversation History</h3>
          {unreadInThreads > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-300" />
              {unreadInThreads} unread
            </div>
          ) : null}
        </div>
        <div className="grid gap-3">
          {!sortedThreads.length && (
            <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
              No portal threads yet.
            </p>
          )}

          {sortedThreads.map((thread) => {
            const unreadInThread = (!thread.fromAdmin && !thread.readAt ? 1 : 0)
              + (thread.replies || []).filter((reply) => !reply.fromAdmin && !reply.readAt).length;

            return (
              <article
                key={thread.id}
                className={cn(
                  "rounded-lg border bg-background p-4 grid gap-3 transition",
                  unreadInThread > 0
                    ? "border-amber-400/35 bg-amber-500/5 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-primary">{thread.subject}</p>
                      {unreadInThread > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                          <span className="size-1.5 rounded-full bg-amber-300" />
                          New {unreadInThread}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">Started {formatDate(thread.createdAt)}</p>
                  </div>
                  <Pill tone="quiet">{(thread.replies?.length || 0) + 1} messages</Pill>
                </div>

                <div className="grid gap-2">
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">teChia</p>
                    <p className="mt-1 text-sm text-primary whitespace-pre-wrap">{thread.body}</p>
                  </div>

                  {(thread.replies || []).map((reply) => {
                    const unreadClientReply = !reply.fromAdmin && !reply.readAt;
                    return (
                      <div
                        key={reply.id}
                        className={cn(
                          "rounded-lg px-3 py-2 border",
                          reply.fromAdmin
                            ? "border-cyan-500/20 bg-cyan-500/5"
                            : unreadClientReply
                              ? "border-amber-400/40 bg-amber-500/10"
                              : "border-emerald-500/20 bg-emerald-500/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <p className={cn("text-[11px] font-semibold uppercase tracking-wider", reply.fromAdmin ? "text-cyan-400" : unreadClientReply ? "text-amber-300" : "text-emerald-400")}>
                            {reply.fromAdmin ? "teChia" : client.contactName || client.name}
                          </p>
                          {unreadClientReply ? (
                            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-primary whitespace-pre-wrap">{reply.body}</p>
                        <p className="mt-1 text-[11px] text-muted">{formatDate(reply.createdAt)}</p>
                      </div>
                    );
                  })}
                </div>

                <ActionForm action={sendPortalMessageReplyAction} className="grid gap-2" successMessage="Reply sent to client portal.">
                  <input type="hidden" name="messageId" value={thread.id} />
                  <Field label="Reply in this thread">
                    <Textarea name="body" rows={3} placeholder="Write your reply to continue this conversation..." required />
                  </Field>
                  <SubmitButton>
                    <Send className="size-3.5" />
                    Send reply
                  </SubmitButton>
                </ActionForm>
              </article>
            );
          })}
        </div>
      </section>

      {/* Client Requirement Responses */}
      <section className="grid gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Client Responses To Requests</h3>
        <div className="grid gap-3">
          {!submittedRequirements.length && (
            <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
              No client responses to requirements yet.
            </p>
          )}

          {submittedRequirements.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-background p-4 grid gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{item.title}</p>
                  {item.project?.title ? <p className="text-xs text-muted">Project: {item.project.title}</p> : null}
                </div>
                <Pill tone="good">{item.status}</Pill>
              </div>

              {item.response ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Client response</p>
                  <p className="mt-1 text-sm text-primary whitespace-pre-wrap">{item.response}</p>
                </div>
              ) : null}

              {item.fileUrl ? (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-surface"
                >
                  <ExternalLink className="size-3.5" />
                  Open attached file
                </a>
              ) : null}

              <p className="text-[11px] text-muted">Submitted {formatDate(item.submittedAt || item.updatedAt)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Client Upload Review Queue */}
      <section className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Client Upload Review Queue</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUploadFilter("ALL")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                uploadFilter === "ALL"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              )}
            >
              All ({portalFiles.length})
            </button>
            <button
              type="button"
              onClick={() => setUploadFilter("PENDING")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                uploadFilter === "PENDING"
                  ? "border-amber-500/40 bg-amber-500/20 text-amber-200"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
              )}
            >
              <span className="size-1.5 rounded-full bg-amber-300" />
              Pending Uploads ({pendingPortalFiles.length})
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          {!filteredPortalFiles.length && (
            <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
              {uploadFilter === "PENDING"
                ? "No pending uploads. Everything has been reviewed."
                : "No uploads from this client yet."}
            </p>
          )}

          {filteredPortalFiles.map((file) => (
            <article key={file.id} className="rounded-lg border border-border bg-background p-4 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-semibold text-primary">{file.name}</p>
                  <p className="text-xs text-muted">
                    {file.category} · {file.fileType || "File"} · {formatDate(file.createdAt)}
                  </p>
                </div>
                <Pill tone={file.status === "APPROVED" ? "good" : file.status === "REJECTED" ? "danger" : "warn"}>{file.status}</Pill>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {file.url && file.url !== "#" && file.url !== "#not-uploaded" && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-surface"
                  >
                    <ExternalLink className="size-3.5" />
                    Open file
                  </a>
                )}
                {file.project?.title ? <Pill tone="quiet">Project: {file.project.title}</Pill> : <Pill tone="quiet">No project linked</Pill>}
              </div>

              {file.notes ? (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current comment</p>
                  <p className="mt-1 text-sm text-primary whitespace-pre-wrap">{file.notes}</p>
                </div>
              ) : null}

              <ActionForm action={reviewPortalFileAction} className="grid gap-3" successMessage="File review updated and client notified.">
                <input type="hidden" name="fileId" value={file.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Decision">
                    <Select name="status" defaultValue={file.status || "PENDING"}>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject / Needs revision</option>
                      <option value="ARCHIVED">Archive</option>
                    </Select>
                  </Field>

                  <Field label="Attach to project">
                    <Select name="projectId" defaultValue={file.project?.id || ""}>
                      <option value="">— None —</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.title}</option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Comment to client (optional)">
                  <Textarea name="notes" defaultValue={file.notes || ""} placeholder="Add review feedback for this upload..." rows={3} />
                </Field>

                <SubmitButton>
                  <CheckCircle2 className="size-3.5" />
                  Save review
                </SubmitButton>
              </ActionForm>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Client Detail Drawer ────────────────────────────────────────────────────
function ClientDetailDrawer({
  client,
  projects,
  locale,
  onClose
}: {
  client: ClientRecord;
  projects: ProjectRecord[];
  locale: Locale;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "projects" | "edit" | "portal">("overview");
  const [updateState, updateAction, updatePending] = useActionState(updateClientAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteClientAction, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const portalUnreadCount = getClientPortalUnreadCount(client);

  // Close drawer after successful delete
  useEffect(() => {
    if (deleteState?.success) onClose();
  }, [deleteState?.success, onClose]);

  useEffect(() => {
    if (tab !== "portal" || portalUnreadCount === 0) return;

    let cancelled = false;
    void (async () => {
      const result = await markClientPortalThreadsReadAction(client.id);
      if (!cancelled && result?.success) {
        router.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, portalUnreadCount, client.id, router]);

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "projects" as const, label: `Projects (${projects.length})` },
    { key: "portal" as const, label: portalUnreadCount > 0 ? `Portal (${portalUnreadCount})` : "Portal" },
    { key: "edit" as const, label: "Edit" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <BriefcaseBusiness className="size-3.5" /> Client
            </p>
            <h2 className="break-words text-xl font-semibold text-primary">{client.name}</h2>
            {client.industry && <p className="break-words text-sm text-muted">{client.industry}{client.country ? ` · ${client.country}` : ""}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Pill tone={statusTone(client.status)}>{labelMap[client.status]}</Pill>
            <Pill tone={statusTone(client.priority)}>{labelMap[client.priority]}</Pill>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:text-primary">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-border px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
          <div className="flex min-w-max">
            {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition",
                tab === t.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary"
              )}
            >
              {t.label}
            </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="grid gap-5">
              <section className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contact Info</h3>
                <div className="grid gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-2">
                  <div><p className="text-xs text-muted">Primary contact</p><p className="mt-0.5 font-medium text-primary">{client.contactName || "-"}</p></div>
                  <div><p className="text-xs text-muted">Role</p><p className="mt-0.5 text-primary">{client.contactRole || "-"}</p></div>
                  <div><p className="text-xs text-muted">Email</p>
                    {client.email ? <a href={`mailto:${client.email}`} className="mt-0.5 block break-all text-accent hover:underline">{client.email}</a> : <p className="mt-0.5 text-muted">-</p>}
                  </div>
                  <div><p className="text-xs text-muted">Phone</p>
                    {client.phone ? <a href={`tel:${client.phone}`} className="mt-0.5 block text-primary hover:underline">{client.phone}</a> : <p className="mt-0.5 text-muted">-</p>}
                  </div>
                  <div><p className="text-xs text-muted">Website</p>
                    {client.website ? <a href={client.website} target="_blank" rel="noopener noreferrer" className="mt-0.5 block break-all text-accent hover:underline">{client.website}</a> : <p className="mt-0.5 text-muted">-</p>}
                  </div>
                  <div><p className="text-xs text-muted">Location</p><p className="mt-0.5 text-primary">{[client.city, client.country].filter(Boolean).join(", ") || "-"}</p></div>
                </div>
              </section>

              <section className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Business</h3>
                <div className="grid gap-3 rounded-lg border border-border bg-background p-4 text-sm sm:grid-cols-2">
                  <div><p className="text-xs text-muted">Industry</p><p className="mt-0.5 text-primary">{client.industry || "-"}</p></div>
                  <div><p className="text-xs text-muted">Source</p><p className="mt-0.5 text-primary">{client.source || "-"}</p></div>
                  <div><p className="text-xs text-muted">Estimated value</p><p className="mt-0.5 text-primary">{compactMoney(client.estimatedValue)}</p></div>
                  <div><p className="text-xs text-muted">Owner</p><p className="mt-0.5 text-primary">{client.owner?.name || client.owner?.email || "Unassigned"}</p></div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted">Tags</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {client.tags.length ? client.tags.map((t) => <Pill key={t} tone="quiet">{t}</Pill>) : <p className="text-muted">No tags</p>}
                    </div>
                  </div>
                </div>
              </section>

              {client.notes && (
                <section className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Notes</h3>
                  <p className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-muted whitespace-pre-wrap">{client.notes}</p>
                </section>
              )}

              {client.contacts.length > 0 && (
                <section className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contacts ({client.contacts.length})</h3>
                  <div className="grid gap-2">
                    {client.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-semibold text-primary">{contact.name}</p>
                          {contact.role && <p className="text-xs text-muted">{contact.role}</p>}
                          {contact.email && <a href={`mailto:${contact.email}`} className="break-all text-xs text-accent hover:underline">{contact.email}</a>}
                          {contact.phone && <p className="text-xs text-muted">{contact.phone}</p>}
                        </div>
                        {contact.isPrimary && <Pill tone="good">Primary</Pill>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <p className="text-xs text-muted">Created {formatDate(client.createdAt)} · Updated {formatDate(client.updatedAt)}</p>
            </div>
          )}

          {/* ── Projects ── */}
          {tab === "projects" && (
            <div className="grid gap-5">
              <section className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Add Project</h3>
                <ActionForm action={createProjectWithTaskAction} className="grid gap-3 rounded-lg border border-border bg-background p-4" successMessage="Project created and added to the delivery board.">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="clientId" value={client.id} />
                  <Field label="Title"><Input name="title" required placeholder="Website redesign" /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Status"><Select name="status" defaultValue="PLANNED">{projectStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                    <Field label="Priority"><Select name="priority" defaultValue="MEDIUM">{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                  </div>
                  <Field label="Description"><Textarea name="description" placeholder="Scope and objectives" /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Budget"><Input name="budget" type="number" min={0} /></Field>
                    <Field label="Progress %"><Input name="progress" type="number" min={0} max={100} defaultValue={0} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Start date"><DatePicker name="startDate" /></Field>
                    <Field label="Due date"><DatePicker name="dueDate" /></Field>
                  </div>
                  <SubmitButton>Add project</SubmitButton>
                </ActionForm>
              </section>

              <section className="grid gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {projects.length ? `${projects.length} Project${projects.length !== 1 ? "s" : ""}` : "No projects yet"}
                </h3>
                {projects.map((project) => (
                  <ClientProjectCard key={project.id} project={project} locale={locale} />
                ))}
              </section>
            </div>
          )}

          {/* ── Portal ── */}
          {tab === "portal" && (
            <ClientPortalManagement client={client} projects={projects} />
          )}

          {/* ── Edit ── */}
          {tab === "edit" && (
            <div className="grid gap-6">
              <section className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Edit Client</h3>
                <form action={updateAction} className="grid gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={client.id} />
                  <Field label="Client name"><Input name="name" required defaultValue={client.name} /></Field>
                  <Field label="Industry"><Input name="industry" defaultValue={client.industry ?? ""} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Status"><Select name="status" defaultValue={client.status}>{clientStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                    <Field label="Priority"><Select name="priority" defaultValue={client.priority}>{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                  </div>
                  <Field label="Primary contact"><Input name="contactName" defaultValue={client.contactName ?? ""} /></Field>
                  <Field label="Contact role"><Input name="contactRole" defaultValue={client.contactRole ?? ""} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Email"><Input name="email" type="email" defaultValue={client.email ?? ""} /></Field>
                    <Field label="Phone"><Input name="phone" defaultValue={client.phone ?? ""} /></Field>
                  </div>
                  <Field label="Website"><Input name="website" type="url" defaultValue={client.website ?? ""} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Country"><Input name="country" defaultValue={client.country ?? ""} /></Field>
                    <Field label="City"><Input name="city" defaultValue={client.city ?? ""} /></Field>
                  </div>
                  <Field label="Portal language">
                    <select
                      name="preferredLocale"
                      defaultValue={client.preferredLocale ?? "en"}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-blue-500/50"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </Field>
                  <Field label="Estimated value"><Input name="estimatedValue" type="number" min={0} defaultValue={client.estimatedValue ?? ""} /></Field>
                  <Field label="Tags"><Input name="tags" defaultValue={client.tags.join(", ")} placeholder="seo, portal, priority" /></Field>
                  <Field label="Notes"><Textarea name="notes" defaultValue={client.notes ?? ""} /></Field>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="btn-primary justify-center rounded-lg px-4 py-3 text-sm disabled:opacity-60"
                  >
                    {updatePending ? <Loader2 className="size-4 animate-spin" /> : <Edit2 className="size-4" />}
                    {updatePending ? "Saving…" : "Save changes"}
                  </button>
                  {updateState?.error && <p className="text-xs text-red-400">{updateState.error}</p>}
                  {updateState?.success && <p className="text-xs text-emerald-400">Client updated successfully.</p>}
                </form>
              </section>

              <section className="grid gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400">Danger Zone</h3>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                  <p className="text-sm text-muted">Deleting this client is permanent and cannot be undone. All linked data will be removed.</p>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="size-4" /> Delete client
                    </button>
                  ) : (
                    <form action={deleteAction} className="mt-3 flex flex-wrap items-center gap-3">
                      <input type="hidden" name="id" value={client.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <p className="w-full text-sm font-semibold text-red-400">Are you sure? This cannot be undone.</p>
                      <button
                        type="submit"
                        disabled={deletePending}
                        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
                      >
                        {deletePending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        {deletePending ? "Deleting…" : "Confirm delete"}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="text-sm text-muted hover:text-primary">Cancel</button>
                      {deleteState?.error && <p className="w-full text-xs text-red-400">{deleteState.error}</p>}
                    </form>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ClientProjectCard({ project, locale }: { project: ProjectRecord; locale: Locale }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateProjectAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProjectAction, null);

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words font-semibold text-primary">{project.title}</h4>
          <p className="break-words text-xs text-muted">{project.client?.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone={statusTone(project.status)}>{labelMap[project.status]}</Pill>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-muted hover:text-primary"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {!editing && (
        <div className="mt-3 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
          {project.description && <p className="sm:col-span-2 text-xs leading-relaxed">{project.description}</p>}
          <p>Owner: {project.owner?.name || project.owner?.email || "Unassigned"}</p>
          <p>Due: {project.dueLabel || "-"}</p>
          <p>Budget: {compactMoney(project.budget)}</p>
          <p>Priority: {labelMap[project.priority]}</p>
          <div className="sm:col-span-2 mt-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-4 grid gap-4">
          <form action={updateAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={project.id} />
            <Field label="Title"><Input name="title" required defaultValue={project.title} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status"><Select name="status" defaultValue={project.status}>{projectStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
              <Field label="Priority"><Select name="priority" defaultValue={project.priority}>{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
            </div>
            <Field label="Description"><Textarea name="description" defaultValue={project.description ?? ""} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Budget"><Input name="budget" type="number" min={0} defaultValue={project.budget ?? ""} /></Field>
              <Field label="Progress %"><Input name="progress" type="number" min={0} max={100} defaultValue={project.progress} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date"><DatePicker key={`project-start-${project.id}-${project.startDate ?? "empty"}`} name="startDate" defaultValue={project.startDate ? project.startDate.slice(0, 10) : ""} /></Field>
              <Field label="Due date"><DatePicker key={`project-due-${project.id}-${project.dueDate ?? "empty"}`} name="dueDate" defaultValue={project.dueDate ? project.dueDate.slice(0, 10) : ""} /></Field>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={updatePending}
                className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60"
              >
                {updatePending ? <Loader2 className="size-3.5 animate-spin" /> : <Edit2 className="size-3.5" />}
                {updatePending ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
            </div>
            {updateState?.error && <p className="text-xs text-red-400">{updateState.error}</p>}
            {updateState?.success && <p className="text-xs text-emerald-400">Saved.</p>}
          </form>

          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300"
              >
                <Trash2 className="size-3.5" /> Delete project
              </button>
            ) : (
              <form action={deleteAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="locale" value={locale} />
                <span className="w-full text-xs font-semibold text-red-400">Delete forever?</span>
                <button
                  type="submit"
                  disabled={deletePending}
                  className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 disabled:opacity-60"
                >
                  {deletePending ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                {deleteState?.error && <p className="w-full text-xs text-red-400">{deleteState.error}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
}



function Projects({ data, locale }: { data: AdminDashboardData; locale: Locale }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createState, createAction, createPending] = useActionState(createProjectWithTaskAction, null);

  const selectedProject = selectedProjectId
    ? data.projects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <Panel title="Create Project" eyebrow="Delivery">
          <form action={createAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <Field label="Client">
              <Select name="clientId" required>
                <option value="">Select client</option>
                {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </Select>
            </Field>
            <Field label="Title"><Input name="title" required placeholder="Website redesign" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status"><Select name="status" defaultValue="PLANNED">{projectStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
              <Field label="Priority"><Select name="priority" defaultValue="MEDIUM">{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
            </div>
            <Field label="Description"><Textarea name="description" placeholder="Scope, objectives, constraints" /></Field>
            <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Public showcase</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showInPortfolio" className="size-4 accent-cyan-400" /> Show in portfolio</label>
                <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showOnHomepage" className="size-4 accent-cyan-400" /> Show on homepage</label>
                <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showInFounder" className="size-4 accent-cyan-400" /> Show on founder page</label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Public order"><Input name="publicOrder" type="number" min={0} defaultValue={0} /></Field>
                <Field label="Public slug"><Input name="publicSlug" placeholder="case-study-slug" /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title (EN)"><Input name="publicTitleEn" /></Field>
                <Field label="Title (FR)"><Input name="publicTitleFr" /></Field>
              </div>
              <Field label="Eyebrow (EN)"><Input name="publicEyebrowEn" placeholder="Client project, Internal product..." /></Field>
              <Field label="Eyebrow (FR)"><Input name="publicEyebrowFr" placeholder="Projet client, Produit interne..." /></Field>
              <Field label="Description (EN)"><Textarea name="publicDescriptionEn" className="min-h-20" /></Field>
              <Field label="Description (FR)"><Textarea name="publicDescriptionFr" className="min-h-20" /></Field>
              <Field label="Tech stack (comma separated)"><Input name="publicTechStack" placeholder="Next.js, Prisma, PostgreSQL" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Budget"><Input name="budget" type="number" min={0} /></Field>
              <Field label="Progress"><Input name="progress" type="number" min={0} max={100} defaultValue={0} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date"><DatePicker name="startDate" /></Field>
              <Field label="Due date"><DatePicker name="dueDate" /></Field>
            </div>
            <button
              type="submit"
              disabled={createPending}
              className="btn-primary justify-center rounded-lg px-4 py-3 text-sm disabled:opacity-60"
            >
              {createPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {createPending ? "Creating…" : "Create project"}
            </button>
            {createState?.error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <X className="mt-0.5 size-3 shrink-0" />{createState.error}
              </p>
            )}
            {createState?.success && (
              <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                <CheckCircle2 className="size-3 shrink-0" />Project created and added to the delivery board.
              </p>
            )}
          </form>
        </Panel>

        <Panel title="All Projects" eyebrow="Projects">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className="group rounded-lg border border-border bg-background p-4 text-left transition hover:border-accent/40 hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-primary transition group-hover:text-accent">{project.title}</h3>
                    <p className="break-words text-sm text-muted">{project.client.name}</p>
                  </div>
                  <Pill tone={statusTone(project.status)}>{labelMap[project.status]}</Pill>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{project.description || "No description."}</p>
                <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                  <p>Owner: {project.owner?.name || project.owner?.email || "Unassigned"}</p>
                  <p>Due: {project.dueLabel || "-"}</p>
                  <p>Budget: {compactMoney(project.budget)}</p>
                  <p>Priority: {labelMap[project.priority]}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.showInPortfolio ? <Pill tone="good">Portfolio</Pill> : null}
                  {project.showOnHomepage ? <Pill tone="good">Homepage</Pill> : null}
                  {project.showInFounder ? <Pill tone="good">Founder</Pill> : null}
                  <Pill tone="quiet">Order {project.publicOrder}</Pill>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
                </div>
              </button>
            ))}
            {!data.projects.length ? <EmptyState title="No projects yet." /> : null}
          </div>
        </Panel>
      </div>

      {selectedProject && (
        <ProjectDetailDrawer
          project={selectedProject}
          locale={locale}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </>
  );
}

function ProjectDetailDrawer({
  project,
  locale,
  onClose
}: {
  project: ProjectRecord;
  locale: Locale;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(updateProjectAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProjectAction, null);

  useEffect(() => {
    if (deleteState?.success) onClose();
  }, [deleteState?.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-muted">{project.client.name}</p>
            <h2 className="break-words text-lg font-bold text-primary">{project.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-background hover:text-primary transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-4 sm:p-6">
          {/* Status / Priority pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={statusTone(project.status)}>{labelMap[project.status]}</Pill>
            <Pill tone={statusTone(project.priority)}>{labelMap[project.priority]}</Pill>
            {project.dueLabel && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">Due {project.dueLabel}</span>}
          </div>

          {/* Description */}
          {project.description && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Description</h3>
              <p className="break-words text-sm leading-relaxed text-primary">{project.description}</p>
            </section>
          )}

          {/* Meta grid */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Details</h3>
            <dl className="grid gap-x-4 gap-y-2 text-sm min-[420px]:grid-cols-2">
              <div><dt className="text-muted">Owner</dt><dd className="font-medium">{project.owner?.name || project.owner?.email || "—"}</dd></div>
              <div><dt className="text-muted">Budget</dt><dd className="font-medium">{compactMoney(project.budget)}</dd></div>
              <div><dt className="text-muted">Start</dt><dd className="font-medium">{project.startDate ? project.startDate.slice(0, 10) : "—"}</dd></div>
              <div><dt className="text-muted">Due</dt><dd className="font-medium">{project.dueLabel || "—"}</dd></div>
              <div><dt className="text-muted">Created</dt><dd className="font-medium">{formatDate(project.createdAt)}</dd></div>
              <div><dt className="text-muted">Updated</dt><dd className="font-medium">{formatDate(project.updatedAt)}</dd></div>
            </dl>
          </section>

          {/* Progress bar */}
          <section>
            <div className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>Progress</span><span className="font-semibold text-primary">{project.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <span className="block h-full rounded-full bg-accent transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </section>

          {/* Edit toggle */}
          <section>
            <button
              type="button"
              onClick={() => { setEditing((v) => !v); setConfirmDelete(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted hover:text-primary transition"
            >
              <Edit2 className="size-3.5" />{editing ? "Cancel editing" : "Edit project"}
            </button>
          </section>

          {editing && (
            <section className="rounded-lg border border-border bg-background p-4">
              <form action={updateAction} className="grid gap-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={project.id} />
                <Field label="Title"><Input name="title" required defaultValue={project.title} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Status"><Select name="status" defaultValue={project.status}>{projectStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                  <Field label="Priority"><Select name="priority" defaultValue={project.priority}>{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
                </div>
                <Field label="Description"><Textarea name="description" defaultValue={project.description ?? ""} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Budget"><Input name="budget" type="number" min={0} defaultValue={project.budget ?? ""} /></Field>
                  <Field label="Progress %"><Input name="progress" type="number" min={0} max={100} defaultValue={project.progress} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Start date"><DatePicker key={`client-project-start-${project.id}-${project.startDate ?? "empty"}`} name="startDate" defaultValue={project.startDate ? project.startDate.slice(0, 10) : ""} /></Field>
                  <Field label="Due date"><DatePicker key={`client-project-due-${project.id}-${project.dueDate ?? "empty"}`} name="dueDate" defaultValue={project.dueDate ? project.dueDate.slice(0, 10) : ""} /></Field>
                </div>
                <div className="grid gap-3 rounded-lg border border-border bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Public showcase</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showInPortfolio" defaultChecked={project.showInPortfolio} className="size-4 accent-cyan-400" /> Show in portfolio</label>
                    <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showOnHomepage" defaultChecked={project.showOnHomepage} className="size-4 accent-cyan-400" /> Show on homepage</label>
                    <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showInFounder" defaultChecked={project.showInFounder} className="size-4 accent-cyan-400" /> Show on founder page</label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Public order"><Input name="publicOrder" type="number" min={0} defaultValue={project.publicOrder} /></Field>
                    <Field label="Public slug"><Input name="publicSlug" defaultValue={project.publicSlug ?? ""} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title (EN)"><Input name="publicTitleEn" defaultValue={project.publicTitleEn ?? ""} /></Field>
                    <Field label="Title (FR)"><Input name="publicTitleFr" defaultValue={project.publicTitleFr ?? ""} /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Eyebrow (EN)"><Input name="publicEyebrowEn" defaultValue={project.publicEyebrowEn ?? ""} /></Field>
                    <Field label="Eyebrow (FR)"><Input name="publicEyebrowFr" defaultValue={project.publicEyebrowFr ?? ""} /></Field>
                  </div>
                  <Field label="Description (EN)"><Textarea name="publicDescriptionEn" defaultValue={project.publicDescriptionEn ?? ""} className="min-h-20" /></Field>
                  <Field label="Description (FR)"><Textarea name="publicDescriptionFr" defaultValue={project.publicDescriptionFr ?? ""} className="min-h-20" /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Problem (EN)"><Textarea name="publicProblemEn" defaultValue={project.publicProblemEn ?? ""} className="min-h-16" /></Field>
                    <Field label="Problem (FR)"><Textarea name="publicProblemFr" defaultValue={project.publicProblemFr ?? ""} className="min-h-16" /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Solution (EN)"><Textarea name="publicSolutionEn" defaultValue={project.publicSolutionEn ?? ""} className="min-h-16" /></Field>
                    <Field label="Solution (FR)"><Textarea name="publicSolutionFr" defaultValue={project.publicSolutionFr ?? ""} className="min-h-16" /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Role (EN)"><Textarea name="publicRoleEn" defaultValue={project.publicRoleEn ?? ""} className="min-h-16" /></Field>
                    <Field label="Role (FR)"><Textarea name="publicRoleFr" defaultValue={project.publicRoleFr ?? ""} className="min-h-16" /></Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Business value (EN)"><Textarea name="publicBusinessValueEn" defaultValue={project.publicBusinessValueEn ?? ""} className="min-h-16" /></Field>
                    <Field label="Business value (FR)"><Textarea name="publicBusinessValueFr" defaultValue={project.publicBusinessValueFr ?? ""} className="min-h-16" /></Field>
                  </div>
                  <Field label="Tech stack (comma separated)"><Input name="publicTechStack" defaultValue={(project.publicTechStack ?? []).join(", ")} /></Field>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent/90 transition disabled:opacity-60"
                  >
                    {updatePending ? <Loader2 className="size-3.5 animate-spin" /> : <Edit2 className="size-3.5" />}
                    {updatePending ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                </div>
                {updateState?.error && <p className="text-xs text-red-400">{updateState.error}</p>}
                {updateState?.success && <p className="text-xs text-emerald-400">Saved successfully.</p>}
              </form>
            </section>
          )}

          {/* Danger zone */}
          <section className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">Danger Zone</h3>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition"
              >
                <Trash2 className="size-3.5" /> Delete project
              </button>
            ) : (
              <form action={deleteAction} className="grid gap-2">
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="locale" value={locale} />
                <p className="text-xs text-red-400 font-semibold">This will permanently delete the project and its board tasks. Continue?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 disabled:opacity-60"
                  >
                    {deletePending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    {deletePending ? "Deleting…" : "Delete forever"}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                </div>
                {deleteState?.error && <p className="text-xs text-red-400">{deleteState.error}</p>}
              </form>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}


function RequestCard({
  id,
  type,
  name,
  email,
  phone,
  whatsapp,
  company,
  status,
  notes,
  extra,
  clientId,
  locale,
  conversations,
  onOpenDetail,
  onDeleted,
  demo,
  demoTitle,
  projectNeed,
  businessType,
  budgetRange,
  timeline,
  country,
  preferredLanguage
}: {
  id: string;
  type: "lead" | "contact" | "demo";
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  company?: string | null;
  status: string;
  notes?: string | null;
  extra?: React.ReactNode;
  clientId?: string | null;
  locale: Locale;
  conversations: AdminDashboardData["conversations"];
  onOpenDetail: (info: { id: string; type: "lead" | "contact" | "demo"; name: string; email: string; phone?: string | null; whatsapp?: string | null; company?: string | null; status: string; notes?: string | null; clientId?: string | null; demo?: string | null; demoTitle?: string | null; projectNeed?: string | null; businessType?: string | null; budgetRange?: string | null; timeline?: string | null; country?: string | null; preferredLanguage?: string | null }) => void;
  onDeleted?: () => void;
  // Demo-specific optional fields
  demo?: string | null;
  demoTitle?: string | null;
  projectNeed?: string | null;
  businessType?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
}) {
  const conv = conversations.find((c) => c.requestType === type && c.requestId === id);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRequestAction, null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (deleteState?.success) onDeleted?.();
  }, [deleteState?.success, onDeleted]);

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-primary">{name}</h3>
          <p className="break-words text-sm text-muted">{email}{company ? ` · ${company}` : ""}</p>
          {(phone || whatsapp) ? (
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
              {phone ? <span>📞 {phone}</span> : null}
              {whatsapp ? <span className="text-[#25D366]"><MessageCircle className="inline size-3 mr-0.5" />{whatsapp}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Pill tone={statusTone(status as keyof typeof labelMap)}>{labelMap[status as keyof typeof labelMap] ?? status}</Pill>
          {clientId ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">Client linked</span>
          ) : null}
        </div>
      </div>
      {extra}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenDetail({ id, type, name, email, phone, whatsapp, company, status, notes, clientId, demo, demoTitle, projectNeed, businessType, budgetRange, timeline, country, preferredLanguage })}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-primary transition"
        >
          View Details
        </button>
        {conv ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Mail className="size-3" />{conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""}
          </span>
        ) : null}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-red-400 transition"
            title="Delete request"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : (
          <form action={deleteAction} className="ml-auto flex items-center gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="type" value={type} />
            <span className="text-xs text-muted">Delete?</span>
            <button type="submit" disabled={deletePending} className="rounded px-2 py-1 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-60">
              {deletePending ? <Loader2 className="size-3 animate-spin" /> : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
          </form>
        )}
      </div>
      {deleteState?.error ? <p className="mt-1 text-xs text-red-400">{deleteState.error}</p> : null}
      <StatusForm locale={locale} id={id} type={type} status={status} notes={notes} />
    </article>
  );
}

function RequestDetailDrawer({
  request,
  locale,
  conversations,
  onClose
}: {
  request: {
    id: string; type: "lead" | "contact" | "demo"; name: string; email: string; phone?: string | null;
    whatsapp?: string | null; company?: string | null; status: string; notes?: string | null; clientId?: string | null;
    demo?: string | null; demoTitle?: string | null; projectNeed?: string | null;
    businessType?: string | null; budgetRange?: string | null; timeline?: string | null;
    country?: string | null; preferredLanguage?: string | null;
  } | null;
  locale: Locale;
  conversations: AdminDashboardData["conversations"];
  onClose: () => void;
}) {
  const [clientState, clientAction, clientPending] = useActionState(createClientFromRequestAction, null);
  const [convState, convAction, convPending] = useActionState(createConversationAction, null);
  const [emailState, emailAction, emailPending] = useActionState(sendConversationEmailAction, null);
  const [convertState, convertAction, convertPending] = useActionState(convertDemoToProjectAction, null);
  const [descState, descAction, descPending] = useActionState(updateDemoDescriptionAction, null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const conv = request ? conversations.find((c) => c.requestType === request.type && c.requestId === request.id) : null;

  const handleWhatsapp = async () => {
    if (!request?.whatsapp) return;
    try {
      const link = await getWhatsappLinkAction(request.whatsapp, `Hi ${request.name}, this is Techia Digital Solutions following up on your request.`);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {}
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface border-l border-border shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-muted uppercase tracking-wider">{request.type} Detail</p>
            <h2 className="break-words font-semibold text-primary">{request.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:text-primary"><X className="size-5" /></button>
        </div>

        <div className="grid flex-1 gap-6 px-4 py-5 sm:px-6">
          {/* Contact info */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contact Info</h3>
            <div className="rounded-lg border border-border bg-background p-4 grid gap-2 text-sm">
              <p><span className="text-muted">Email: </span><a href={`mailto:${request.email}`} className="break-all text-accent hover:underline">{request.email}</a></p>
              {request.phone ? <p><span className="text-muted">Phone: </span><a href={`tel:${request.phone}`} className="text-primary hover:underline">{request.phone}</a></p> : null}
              {request.whatsapp ? (
                <p>
                  <span className="text-muted">WhatsApp: </span>
                  <button type="button" onClick={handleWhatsapp} className="text-[#25D366] hover:underline inline-flex items-center gap-1">
                    <MessageCircle className="size-3" />{request.whatsapp}
                  </button>
                </p>
              ) : null}
              {request.company ? <p><span className="text-muted">Company: </span>{request.company}</p> : null}
            </div>
          </section>

          {/* Demo info (demo type only) */}
          {request.type === "demo" ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Demo Request</h3>
              <div className="rounded-lg border border-border bg-background p-4 grid gap-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  {request.demoTitle ? <div><span className="text-xs text-muted uppercase tracking-wide">Demo</span><p className="mt-0.5 text-primary font-medium">{request.demoTitle}</p></div> : null}
                  {request.businessType ? <div><span className="text-xs text-muted uppercase tracking-wide">Business type</span><p className="mt-0.5 text-primary">{request.businessType}</p></div> : null}
                  {request.budgetRange ? <div><span className="text-xs text-muted uppercase tracking-wide">Budget range</span><p className="mt-0.5 text-primary">{request.budgetRange}</p></div> : null}
                  {request.timeline ? <div><span className="text-xs text-muted uppercase tracking-wide">Timeline</span><p className="mt-0.5 text-primary">{request.timeline}</p></div> : null}
                  {request.country ? <div><span className="text-xs text-muted uppercase tracking-wide">Country</span><p className="mt-0.5 text-primary">{request.country}</p></div> : null}
                  {request.preferredLanguage ? <div><span className="text-xs text-muted uppercase tracking-wide">Language</span><p className="mt-0.5 text-primary">{request.preferredLanguage}</p></div> : null}
                </div>
              </div>
            </section>
          ) : null}

          {/* Project description (demo type only — editable) */}
          {request.type === "demo" ? (
            <section className="grid gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Project Description</h3>
                {!descState?.success ? (
                  <button type="button" onClick={() => setEditingDesc((v) => !v)} className="flex items-center gap-1 text-xs text-muted hover:text-primary">
                    <Edit2 className="size-3" />{editingDesc ? "Cancel" : "Edit"}
                  </button>
                ) : null}
              </div>
              {editingDesc && !descState?.success ? (
                <form action={descAction} className="grid gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={request.id} />
                  <textarea
                    name="projectNeed"
                    defaultValue={request.projectNeed ?? ""}
                    className="form-input min-h-28 text-sm"
                    placeholder="Describe the project need, scope, and requirements…"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={descPending} className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60">
                      {descPending ? <Loader2 className="size-3.5 animate-spin" /> : null}Save
                    </button>
                    <button type="button" onClick={() => setEditingDesc(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                  </div>
                  {descState?.error ? <p className="text-xs text-red-400">{descState.error}</p> : null}
                  {descState?.success ? <p className="text-xs text-emerald-400">Description saved.</p> : null}
                </form>
              ) : (
                <div className="rounded-lg border border-border bg-background p-4 min-h-16">
                  {request.projectNeed ? (
                    <p className="break-words text-sm text-muted whitespace-pre-wrap leading-relaxed">{request.projectNeed}</p>
                  ) : (
                    <p className="text-xs text-muted italic">No project description yet. Click Edit to add one.</p>
                  )}
                </div>
              )}
            </section>
          ) : null}

          {/* Client linking */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Client Record</h3>
            {request.clientId ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">Client record linked. <span className="text-muted text-xs">ID: {request.clientId}</span></p>
              </div>
            ) : (
              <form action={clientAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="requestType" value={request.type} />
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="name" value={request.name} />
                <input type="hidden" name="email" value={request.email} />
                <input type="hidden" name="phone" value={request.phone ?? ""} />
                <input type="hidden" name="whatsapp" value={request.whatsapp ?? ""} />
                <input type="hidden" name="company" value={request.company ?? ""} />
                <button
                  type="submit"
                  disabled={clientPending}
                  className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60"
                >
                  {clientPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Create Client from this Request
                </button>
                {clientState?.error ? <p className="mt-1 text-xs text-red-400">{clientState.error}</p> : null}
                {clientState?.success && clientState.clientId ? <p className="mt-1 text-xs text-emerald-400">Client created successfully.</p> : null}
              </form>
            )}
          </section>

          {/* Convert to Project (demo type only) */}
          {request.type === "demo" && !convertState?.success ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Convert to Project</h3>
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs text-muted mb-3">
                  Creates a Client (if needed) and a Project from this demo request. The demo will be marked as Won.
                </p>
                <form action={convertAction} className="grid gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="requestId" value={request.id} />
                  {request.clientId ? <input type="hidden" name="existingClientId" value={request.clientId} /> : null}
                  {!request.clientId ? (
                    <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Client details</p>
                      <Field label="Name">
                        <Input name="clientName" required defaultValue={request.name} />
                      </Field>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="Email"><Input name="clientEmail" type="email" defaultValue={request.email} /></Field>
                        <Field label="Company"><Input name="clientCompany" defaultValue={request.company ?? ""} /></Field>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="Phone"><Input name="clientPhone" defaultValue={request.phone ?? ""} /></Field>
                        <Field label="Country"><Input name="clientCountry" defaultValue={request.country ?? ""} /></Field>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input type="hidden" name="clientName" value={request.name} />
                      <input type="hidden" name="clientEmail" value={request.email} />
                    </>
                  )}
                  <Field label="Project title">
                    <Input name="projectTitle" required defaultValue={request.demoTitle ? `${request.demoTitle} — ${request.name}` : request.name} />
                  </Field>
                  <Field label="Project description">
                    <Textarea name="projectNeed" defaultValue={request.projectNeed ?? ""} className="min-h-20" placeholder="Scope, requirements, goals…" />
                  </Field>
                  <button
                    type="submit"
                    disabled={convertPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90 transition disabled:opacity-60"
                  >
                    {convertPending ? <Loader2 className="size-4 animate-spin" /> : <FolderKanban className="size-4" />}
                    Convert to Project
                  </button>
                  {convertState?.error ? <p className="text-xs text-red-400">{convertState.error}</p> : null}
                </form>
              </div>
            </section>
          ) : null}
          {request.type === "demo" && convertState?.success ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Project Status</h3>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">✓ Project created. The demo request is now marked as Won.</p>
              </div>
            </section>
          ) : null}

          {/* Conversation */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Conversation</h3>
            {conv ? (
              <div className="grid gap-3">
                <div className="rounded-lg border border-border bg-background p-3 max-h-64 overflow-y-auto grid gap-3">
                  {conv.messages.length === 0 ? <p className="text-xs text-muted">No messages yet.</p> : null}
                  {conv.messages.map((msg: AdminDashboardData["conversations"][0]["messages"][0]) => (
                    <div key={msg.id} className={cn("rounded-lg p-3 text-sm", msg.direction === "outbound" ? "border border-accent/20 bg-accent/10 min-[420px]:ml-4" : "border border-border bg-background min-[420px]:mr-4")}>
                      <p className="text-xs text-muted mb-1">
                        {msg.direction === "outbound" ? "You" : msg.from} · {msg.channel} · {msg.sentAt}
                      </p>
                      {msg.subject ? <p className="font-medium text-primary mb-1">{msg.subject}</p> : null}
                      <p className="break-words text-muted whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm((v) => !v)}
                    className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 text-xs font-medium text-muted hover:text-primary transition"
                  >
                    <Mail className="size-3.5" />Send Email
                  </button>
                  {request.whatsapp ? (
                    <button
                      type="button"
                      onClick={handleWhatsapp}
                      className="flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 px-3 py-2 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/20 transition"
                    >
                      <MessageCircle className="size-3.5" />WhatsApp
                    </button>
                  ) : null}
                </div>
                {showEmailForm ? (
                  <form action={emailAction} className="grid gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="conversationId" value={conv.id} />
                    <input name="to" type="email" required defaultValue={request.email} className="form-input text-sm" placeholder="To (email)" />
                    <input name="subject" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="form-input text-sm" placeholder="Subject" />
                    <textarea name="body" required value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="form-input text-sm min-h-24" placeholder="Message..." />
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={emailPending} className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60">
                        {emailPending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}Send
                      </button>
                      <button type="button" onClick={() => setShowEmailForm(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                    </div>
                    {emailState?.error ? <p className="text-xs text-red-400">{emailState.error}</p> : null}
                    {emailState?.success ? <p className="text-xs text-emerald-400">Email sent.</p> : null}
                  </form>
                ) : null}
              </div>
            ) : (
              <form action={convAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="requestType" value={request.type} />
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="clientId" value={request.clientId ?? ""} />
                <input type="hidden" name="subject" value={`Re: ${request.name}`} />
                <button type="submit" disabled={convPending} className="flex items-center gap-2 rounded-lg bg-surface border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-primary transition disabled:opacity-60">
                  {convPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Start Conversation
                </button>
                {convState?.error ? <p className="mt-1 text-xs text-red-400">{convState.error}</p> : null}
              </form>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

type InquiryDetail = AdminDashboardData["inquiries"][0];

function InquiryDetailDrawer({
  inquiry,
  locale,
  conversations,
  onClose
}: {
  inquiry: InquiryDetail | null;
  locale: Locale;
  conversations: AdminDashboardData["conversations"];
  onClose: () => void;
}) {
  const [notesState, notesAction, notesPending] = useActionState(updateInquiryNotesAction, null);
  const [convertState, convertAction, convertPending] = useActionState(convertInquiryToProjectAction, null);
  const [convState, convAction, convPending] = useActionState(createConversationAction, null);
  const [emailState, emailAction, emailPending] = useActionState(sendConversationEmailAction, null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  const conv = inquiry
    ? conversations.find((c) => c.requestType === "inquiry" && c.requestId === inquiry.id)
    : null;

  const handleWhatsapp = async () => {
    const number = inquiry?.lead?.whatsapp || inquiry?.lead?.phone;
    if (!number) return;
    try {
      const link = await getWhatsappLinkAction(
        number,
        `Hi ${inquiry?.lead?.name ?? "there"}, this is teChia Digital Solutions following up on your project inquiry.`
      );
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {}
  };

  if (!inquiry) return null;

  const lead = inquiry.lead;
  const isConverted = !!inquiry.convertedToTaskId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-surface border-l border-border shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-muted uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban className="size-3.5" /> Project Inquiry
            </p>
            <h2 className="break-words font-semibold text-primary">{lead?.name || inquiry.businessType}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isConverted ? (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Converted to Project ✓
              </span>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:text-primary">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 px-4 py-5 sm:px-6">
          {/* Inquiry details */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Inquiry Details</h3>
            <div className="rounded-lg border border-border bg-background p-4 grid gap-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div><span className="text-xs text-muted uppercase tracking-wide">Business type</span><p className="mt-0.5 text-primary font-medium">{inquiry.businessType}</p></div>
                <div><span className="text-xs text-muted uppercase tracking-wide">Need</span><p className="mt-0.5 text-primary">{inquiry.need}</p></div>
                <div><span className="text-xs text-muted uppercase tracking-wide">Budget</span><p className="mt-0.5 text-primary">{inquiry.budgetRange}</p></div>
                <div><span className="text-xs text-muted uppercase tracking-wide">Timeline</span><p className="mt-0.5 text-primary">{inquiry.timeline}</p></div>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-wide">Project details</span>
                <p className="mt-0.5 break-words text-muted text-sm leading-relaxed whitespace-pre-wrap">{inquiry.details}</p>
              </div>
              <p className="text-xs text-muted">Submitted {formatDate(inquiry.createdAt)}</p>
            </div>
          </section>

          {/* Lead / Contact info */}
          {lead ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</h3>
              <div className="rounded-lg border border-border bg-background p-4 grid gap-2 text-sm">
                <p className="font-semibold text-primary">{lead.name}</p>
                {lead.company ? <p className="text-muted">{lead.company}{lead.country ? ` · ${lead.country}` : ""}</p> : null}
                <div className="flex flex-wrap gap-3 mt-1">
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 break-all text-accent hover:underline text-sm">
                    <Mail className="size-3.5" />{lead.email}
                  </a>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <Phone className="size-3.5" />{lead.phone}
                    </a>
                  ) : null}
                  {lead.whatsapp ? (
                    <button type="button" onClick={handleWhatsapp} className="flex items-center gap-1.5 text-[#25D366] hover:underline text-sm">
                      <MessageCircle className="size-3.5" />{lead.whatsapp}
                    </button>
                  ) : null}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted">Lead status:</span>
                  <Pill tone={statusTone(lead.status)}>{labelMap[lead.status]}</Pill>
                </div>
              </div>
            </section>
          ) : null}

          {/* Client record */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Client Record</h3>
            {inquiry.clientId || inquiry.client ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">
                  Client linked: <span className="font-semibold">{inquiry.client?.name ?? inquiry.clientId}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">No client yet. Converting this inquiry will create one automatically from the contact info.</p>
            )}
          </section>

          {/* Internal notes (editable) */}
          <section className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Internal Notes</h3>
              <button type="button" onClick={() => setEditingNotes((v) => !v)} className="flex items-center gap-1 text-xs text-muted hover:text-primary">
                <Edit2 className="size-3" />{editingNotes ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingNotes ? (
              <form action={notesAction} className="grid gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="inquiryId" value={inquiry.id} />
                <textarea
                  name="internalNotes"
                  defaultValue={inquiry.internalNotes ?? ""}
                  className="form-input min-h-28 text-sm"
                  placeholder="Requirements clarification, scope notes, pricing notes…"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={notesPending} className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60">
                    {notesPending ? <Loader2 className="size-3.5 animate-spin" /> : null}Save notes
                  </button>
                  <button type="button" onClick={() => setEditingNotes(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                </div>
                {notesState?.success ? <p className="text-xs text-emerald-400">Notes saved.</p> : null}
                {notesState?.error ? <p className="text-xs text-red-400">{notesState.error}</p> : null}
              </form>
            ) : (
              <div className="rounded-lg border border-border bg-background p-4 min-h-16">
                {inquiry.internalNotes ? (
                  <p className="break-words text-sm text-muted whitespace-pre-wrap leading-relaxed">{inquiry.internalNotes}</p>
                ) : (
                  <p className="text-xs text-muted italic">No notes yet. Click Edit to add requirements or scope notes.</p>
                )}
              </div>
            )}
          </section>

          {/* Convert to Project */}
          {!isConverted && !convertState?.success ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Convert to Project</h3>
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs text-muted mb-3">
                  This will create a Client (from the lead), a Project, and add a task to the Delivery OS board. The inquiry card will be archived from the pipeline.
                </p>
                <form action={convertAction} className="grid gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="inquiryId" value={inquiry.id} />
                  <Field label="Project title">
                    <Input
                      name="projectTitle"
                      required
                      defaultValue={lead ? `${lead.company || lead.name} — ${inquiry.need}` : inquiry.need}
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea name="projectDescription" defaultValue={inquiry.details} className="min-h-20" />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Budget (€)"><Input name="budget" type="number" min={0} placeholder="5000" /></Field>
                    <Field label="Due date"><DatePicker name="dueDate" /></Field>
                  </div>
                  <button
                    type="submit"
                    disabled={convertPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:bg-accent/90 transition disabled:opacity-60"
                  >
                    {convertPending ? <Loader2 className="size-4 animate-spin" /> : <FolderKanban className="size-4" />}
                    Convert to Project
                  </button>
                  {convertState?.error ? <p className="text-xs text-red-400">{convertState.error}</p> : null}
                  {convertState?.success ? (
                    <p className="text-xs text-emerald-400">
                      ✓ Project created and added to the Delivery board. The inquirer is now a client.
                    </p>
                  ) : null}
                </form>
              </div>
            </section>
          ) : (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Project Status</h3>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">Converted. Check the Delivery OS board for the active task.</p>
              </div>
            </section>
          )}

          {/* Conversation */}
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Conversation</h3>
            {conv ? (
              <div className="grid gap-3">
                <div className="rounded-lg border border-border bg-background p-3 max-h-64 overflow-y-auto grid gap-3">
                  {conv.messages.length === 0 ? <p className="text-xs text-muted">No messages yet.</p> : null}
                  {conv.messages.map((msg: AdminDashboardData["conversations"][0]["messages"][0]) => (
                    <div key={msg.id} className={cn("rounded-lg p-3 text-sm", msg.direction === "outbound" ? "border border-accent/20 bg-accent/10 min-[420px]:ml-4" : "border border-border bg-background min-[420px]:mr-4")}>
                      <p className="text-xs text-muted mb-1">{msg.direction === "outbound" ? "You" : msg.from} · {msg.channel} · {msg.sentAt}</p>
                      {msg.subject ? <p className="font-medium text-primary mb-1">{msg.subject}</p> : null}
                      <p className="break-words text-muted whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setShowEmailForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 text-xs font-medium text-muted hover:text-primary transition">
                    <Mail className="size-3.5" />Send Email
                  </button>
                  {(lead?.whatsapp || lead?.phone) ? (
                    <button type="button" onClick={handleWhatsapp} className="flex items-center gap-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 px-3 py-2 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/20 transition">
                      <MessageCircle className="size-3.5" />WhatsApp
                    </button>
                  ) : null}
                </div>
                {showEmailForm ? (
                  <form action={emailAction} className="grid gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="conversationId" value={conv.id} />
                    <input name="to" type="email" required defaultValue={lead?.email ?? ""} className="form-input text-sm" placeholder="To (email)" />
                    <input name="subject" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="form-input text-sm" placeholder="Subject" />
                    <textarea name="body" required value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="form-input text-sm min-h-24" placeholder="Message…" />
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={emailPending} className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-60">
                        {emailPending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}Send
                      </button>
                      <button type="button" onClick={() => setShowEmailForm(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
                    </div>
                    {emailState?.error ? <p className="text-xs text-red-400">{emailState.error}</p> : null}
                    {emailState?.success ? <p className="text-xs text-emerald-400">Email sent.</p> : null}
                  </form>
                ) : null}
              </div>
            ) : (
              <form action={convAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="requestType" value="inquiry" />
                <input type="hidden" name="requestId" value={inquiry.id} />
                <input type="hidden" name="clientId" value={inquiry.clientId ?? ""} />
                <input type="hidden" name="subject" value={`Re: ${lead?.name ?? inquiry.businessType} inquiry`} />
                <button type="submit" disabled={convPending} className="flex items-center gap-2 rounded-lg bg-surface border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-primary transition disabled:opacity-60">
                  {convPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Start Conversation
                </button>
                {convState?.error ? <p className="mt-1 text-xs text-red-400">{convState.error}</p> : null}
              </form>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

function Requests({ data, locale }: { data: AdminDashboardData; locale: Locale }) {
  const [detailRequest, setDetailRequest] = useState<{
    id: string; type: "lead" | "contact" | "demo"; name: string; email: string; phone?: string | null;
    whatsapp?: string | null; company?: string | null; status: string; notes?: string | null; clientId?: string | null;
    // Demo-specific fields
    demo?: string | null; demoTitle?: string | null; projectNeed?: string | null;
    businessType?: string | null; budgetRange?: string | null; timeline?: string | null;
    country?: string | null; preferredLanguage?: string | null;
  } | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<InquiryDetail | null>(null);
  // Track locally-deleted ids to hide them optimistically while revalidation happens
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const markDeleted = (id: string) => setDeletedIds((prev) => new Set([...prev, id]));

  return (
    <div className="grid gap-5">
      <Panel title="Academy Bonus Claims" eyebrow="Verification">
        <Link
          href="/admin/bonus-claims"
          className="group flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition hover:border-accent/40 hover:bg-surface"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
              <BookOpenText className="size-5" />
            </div>
            <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted transition group-hover:text-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary">Open bonus claims inbox</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Review buyer proof, verify official pack purchases, and deliver all requested bonus files from one screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="default">{data.stats.pendingBonusClaims} open</Pill>
            <Pill tone="quiet">{data.stats.bonusClaims} total</Pill>
          </div>
        </Link>
      </Panel>

      <Panel title="Request Pipeline" eyebrow="Inbound">
        <div className="grid gap-3 lg:grid-cols-3">
          {(["lead", "contact", "demo"] as const).map((type) => (
            <div key={type} className="rounded-lg border border-border bg-background p-4">
              <h3 className="font-semibold capitalize text-primary">{type}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map((status) => <Pill key={status} tone={statusTone(status)}>{labelMap[status]}: {data.statusCounts[type][status]}</Pill>)}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Leads" eyebrow="Sales">
          <div className="grid gap-3">
            {data.leads.filter((l) => !deletedIds.has(l.id)).map((lead) => (
              <RequestCard
                key={lead.id}
                id={lead.id}
                type="lead"
                name={lead.name}
                email={lead.email}
                phone={lead.phone}
                whatsapp={(lead as { whatsapp?: string | null }).whatsapp}
                company={lead.company}
                status={lead.status}
                notes={lead.notes}
                clientId={(lead as { clientId?: string | null }).clientId}
                locale={locale}
                conversations={data.conversations}
                onOpenDetail={setDetailRequest}
                onDeleted={() => markDeleted(lead.id)}
              />
            ))}
            {!data.leads.filter((l) => !deletedIds.has(l.id)).length ? <EmptyState title="No leads yet." /> : null}
          </div>
        </Panel>

        <Panel title="Project Inquiries" eyebrow="Opportunity">
          <div className="grid gap-3">
            {data.inquiries.filter((i) => !deletedIds.has(i.id)).map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                locale={locale}
                onOpenDetail={setDetailInquiry}
                onDeleted={() => markDeleted(inquiry.id)}
              />
            ))}
            {!data.inquiries.filter((i) => !deletedIds.has(i.id)).length ? <EmptyState title="No project inquiries yet." /> : null}
          </div>
        </Panel>

        <Panel title="Contact Messages" eyebrow="Support">
          <div className="grid gap-3">
            {data.contacts.filter((c) => !deletedIds.has(c.id)).map((contact) => (
              <RequestCard
                key={contact.id}
                id={contact.id}
                type="contact"
                name={contact.name}
                email={contact.email}
                phone={contact.phone}
                whatsapp={(contact as { whatsapp?: string | null }).whatsapp}
                company={contact.company}
                status={contact.status}
                notes={contact.notes}
                clientId={(contact as { clientId?: string | null }).clientId}
                locale={locale}
                conversations={data.conversations}
                onOpenDetail={setDetailRequest}
                onDeleted={() => markDeleted(contact.id)}
                extra={<p className="mt-2 text-sm leading-6 text-muted line-clamp-2">{contact.message}</p>}
              />
            ))}
            {!data.contacts.filter((c) => !deletedIds.has(c.id)).length ? <EmptyState title="No contact messages yet." /> : null}
          </div>
        </Panel>

        <Panel title="Demo Requests" eyebrow="Product">
          <div className="grid gap-3">
            {data.demos.filter((d) => !deletedIds.has(d.id)).map((demo) => (
              <RequestCard
                key={demo.id}
                id={demo.id}
                type="demo"
                name={demo.name}
                email={demo.email}
                phone={demo.phone}
                whatsapp={demo.whatsapp}
                company={demo.company}
                status={demo.status}
                notes={demo.notes}
                clientId={demo.clientId}
                locale={locale}
                conversations={data.conversations}
                onOpenDetail={setDetailRequest}
                onDeleted={() => markDeleted(demo.id)}
                demo={demo.demo}
                demoTitle={demo.demoTitle}
                projectNeed={demo.projectNeed}
                businessType={demo.businessType}
                budgetRange={demo.budgetRange}
                timeline={demo.timeline}
                country={demo.country}
                preferredLanguage={demo.preferredLanguage}
                extra={<p className="mt-2 text-xs text-muted">Demo: {demo.demoTitle ?? demo.demo}</p>}
              />
            ))}
            {!data.demos.filter((d) => !deletedIds.has(d.id)).length ? <EmptyState title="No demo requests yet." /> : null}
          </div>
        </Panel>
      </div>

      {detailRequest ? (
        <RequestDetailDrawer
          request={detailRequest}
          locale={locale}
          conversations={data.conversations}
          onClose={() => setDetailRequest(null)}
        />
      ) : null}

      {detailInquiry ? (
        <InquiryDetailDrawer
          inquiry={detailInquiry}
          locale={locale}
          conversations={data.conversations}
          onClose={() => setDetailInquiry(null)}
        />
      ) : null}
    </div>
  );
}

function InquiryCard({
  inquiry,
  locale,
  onOpenDetail,
  onDeleted
}: {
  inquiry: InquiryDetail;
  locale: Locale;
  onOpenDetail: (inquiry: InquiryDetail) => void;
  onDeleted?: () => void;
}) {
  const lead = inquiry.lead;
  const isConverted = !!inquiry.convertedToTaskId;
  const [deleteState, deleteAction, deletePending] = useActionState(deleteInquiryAction, null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (deleteState?.success) onDeleted?.();
  }, [deleteState?.success, onDeleted]);

  return (
    <article className={cn("rounded-lg border bg-background p-4 transition", isConverted ? "border-emerald-500/20 opacity-70" : "border-border hover:border-accent/30")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-primary">{lead?.name || inquiry.businessType}</h3>
          <p className="break-words text-sm text-muted">{inquiry.need} · {inquiry.budgetRange}</p>
          {lead?.company ? <p className="text-xs text-muted">{lead.company}{lead.country ? ` · ${lead.country}` : ""}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {lead ? <Pill tone={statusTone(lead.status)}>{labelMap[lead.status]}</Pill> : null}
          {isConverted ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">Converted</span> : null}
          {inquiry.clientId && !isConverted ? <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">Client linked</span> : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">{inquiry.details}</p>
      {inquiry.internalNotes ? (
        <p className="mt-1.5 text-xs text-accent/70 italic line-clamp-1">📝 {inquiry.internalNotes}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted">Timeline: {inquiry.timeline}</p>
        <span className="text-xs text-muted">·</span>
        <p className="text-xs text-muted">{formatDate(inquiry.createdAt)}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenDetail(inquiry)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-primary transition"
        >
          <FolderKanban className="size-3.5" />View Details
        </button>
        {!isConverted && lead ? (
          <button
            type="button"
            onClick={() => onOpenDetail(inquiry)}
            className="flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition"
          >
            Convert to Project →
          </button>
        ) : null}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-red-400 transition"
            title="Delete inquiry"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : (
          <form action={deleteAction} className="ml-auto flex items-center gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={inquiry.id} />
            <span className="text-xs text-muted">Delete?</span>
            <button type="submit" disabled={deletePending} className="rounded px-2 py-1 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-60">
              {deletePending ? <Loader2 className="size-3 animate-spin" /> : "Yes, delete"}
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
          </form>
        )}
      </div>
      {deleteState?.error ? <p className="mt-1 text-xs text-red-400">{deleteState.error}</p> : null}
      {lead ? <StatusForm locale={locale} id={lead.id} type="lead" status={lead.status} notes={lead.notes} /> : null}
    </article>
  );
}

function SectionEditorCard({
  section,
  isFirst,
  isLast,
  isDragOver,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  isDragOver: boolean;
  onUpdate: (updates: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddItem: (defaultItem: Record<string, unknown>) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, updates: Record<string, unknown>) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-border bg-background p-4 transition-colors",
        isDragOver && "border-accent/60 bg-accent/5 ring-1 ring-accent/30"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 shrink-0 cursor-grab text-muted active:cursor-grabbing" />
          <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">{SECTION_LABELS[section.type]}</span>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="rounded p-1 text-muted hover:text-primary disabled:opacity-30"><ChevronUp className="size-4" /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="rounded p-1 text-muted hover:text-primary disabled:opacity-30"><ChevronDown className="size-4" /></button>
          <button type="button" onClick={onRemove} className="rounded p-1 text-red-400 hover:text-red-300"><Trash2 className="size-4" /></button>
        </div>
      </div>

      {section.type === "hero" && (
        <div className="grid gap-3">
          <Field label="Heading"><Input value={section.heading} onChange={(e) => onUpdate({ heading: e.target.value })} /></Field>
          <Field label="Body"><Textarea value={section.body} onChange={(e) => onUpdate({ body: e.target.value })} className="min-h-20" /></Field>
          <Field label="Image URL"><Input value={section.imageUrl ?? ""} onChange={(e) => onUpdate({ imageUrl: e.target.value })} placeholder="https://..." /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary CTA label"><Input value={section.ctaLabel ?? ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value })} /></Field>
            <Field label="Primary CTA href"><Input value={section.ctaHref ?? ""} onChange={(e) => onUpdate({ ctaHref: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Secondary CTA label"><Input value={section.cta2Label ?? ""} onChange={(e) => onUpdate({ cta2Label: e.target.value })} /></Field>
            <Field label="Secondary CTA href"><Input value={section.cta2Href ?? ""} onChange={(e) => onUpdate({ cta2Href: e.target.value })} /></Field>
          </div>
        </div>
      )}

      {section.type === "stats" && (
        <div className="grid gap-3">
          <Field label="Heading (optional)"><Input value={section.heading ?? ""} onChange={(e) => onUpdate({ heading: e.target.value })} /></Field>
          <div className="grid gap-2">
            {section.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 rounded-lg border border-border bg-surface p-2">
                <div className="flex-1 grid gap-2 sm:grid-cols-2">
                  <Field label="Value"><Input value={item.value} onChange={(e) => onUpdateItem(idx, { value: e.target.value })} placeholder="500+" /></Field>
                  <Field label="Label"><Input value={item.label} onChange={(e) => onUpdateItem(idx, { label: e.target.value })} placeholder="Clients served" /></Field>
                </div>
                <button type="button" onClick={() => onRemoveItem(idx)} className="self-center rounded p-1 text-red-400"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onAddItem({ value: "", label: "" })} className="rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted hover:text-primary">+ Add stat</button>
        </div>
      )}

      {(section.type === "cards" || section.type === "cards_images") && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Heading (optional)"><Input value={section.heading ?? ""} onChange={(e) => onUpdate({ heading: e.target.value })} /></Field>
            <Field label="Eyebrow (optional)"><Input value={section.eyebrow ?? ""} onChange={(e) => onUpdate({ eyebrow: e.target.value })} /></Field>
          </div>
          <div className="grid gap-2">
            {section.items.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-surface p-2">
                <div className="grid gap-2">
                  <Field label="Title"><Input value={item.title} onChange={(e) => onUpdateItem(idx, { title: e.target.value })} /></Field>
                  <Field label="Description"><Textarea value={item.description} onChange={(e) => onUpdateItem(idx, { description: e.target.value })} className="min-h-14" /></Field>
                  {section.type === "cards_images" && (
                    <Field label="Image URL"><Input value={item.imageUrl ?? ""} onChange={(e) => onUpdateItem(idx, { imageUrl: e.target.value })} /></Field>
                  )}
                </div>
                <button type="button" onClick={() => onRemoveItem(idx)} className="mt-1 rounded p-1 text-red-400"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onAddItem({ title: "", description: "", ...(section.type === "cards_images" ? { imageUrl: "" } : {}) })}
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted hover:text-primary"
          >
            + Add card
          </button>
        </div>
      )}

      {section.type === "text" && (
        <div className="grid gap-3">
          <Field label="Heading (optional)"><Input value={section.heading ?? ""} onChange={(e) => onUpdate({ heading: e.target.value })} /></Field>
          <Field label="Body"><Textarea value={section.body} onChange={(e) => onUpdate({ body: e.target.value })} className="min-h-24" /></Field>
        </div>
      )}

      {section.type === "cta" && (
        <div className="grid gap-3">
          <Field label="Heading"><Input value={section.heading} onChange={(e) => onUpdate({ heading: e.target.value })} /></Field>
          <Field label="Body (optional)"><Textarea value={section.body ?? ""} onChange={(e) => onUpdate({ body: e.target.value })} className="min-h-14" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CTA Label"><Input value={section.ctaLabel} onChange={(e) => onUpdate({ ctaLabel: e.target.value })} /></Field>
            <Field label="CTA Href"><Input value={section.ctaHref} onChange={(e) => onUpdate({ ctaHref: e.target.value })} /></Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Content({ data, locale }: { data: AdminDashboardData; locale: Locale }) {
  const [activeSectionsPageId, setActiveSectionsPageId] = useState<string | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);

  // Section drag-and-drop
  const sectionDragRef = useRef<string | null>(null);
  const [sectionDragOverId, setSectionDragOverId] = useState<string | null>(null);

  function handleSectionDragStart(id: string) {
    sectionDragRef.current = id;
  }
  function handleSectionDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (sectionDragRef.current !== id) setSectionDragOverId(id);
  }
  function handleSectionDrop(targetId: string) {
    const fromId = sectionDragRef.current;
    setSectionDragOverId(null);
    sectionDragRef.current = null;
    if (!fromId || fromId === targetId) return;
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === fromId);
      const to = prev.findIndex((s) => s.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }
  function handleSectionDragEnd() {
    sectionDragRef.current = null;
    setSectionDragOverId(null);
  }

  // Nav items drag-to-reorder
  const [navOrder, setNavOrder] = useState(() => data.navItems.map((item) => item.id));
  const [navReorderPending, setNavReorderPending] = useState(false);
  const [navReorderStatus, setNavReorderStatus] = useState<"idle" | "success" | "error">("idle");
  const navDragRef = useRef<string | null>(null);
  const [navDragOverId, setNavDragOverId] = useState<string | null>(null);
  const localNavItems = useMemo(() => {
    const dataMap = new Map(data.navItems.map((item) => [item.id, item]));
    const ordered = navOrder
      .map((id) => dataMap.get(id))
      .filter((item): item is AdminDashboardData["navItems"][number] => Boolean(item));
    const knownIds = new Set(ordered.map((item) => item.id));
    const added = data.navItems.filter((item) => !knownIds.has(item.id));
    return [...ordered, ...added];
  }, [data.navItems, navOrder]);

  function handleNavDragStart(id: string) {
    navDragRef.current = id;
  }
  function handleNavDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (navDragRef.current !== id) setNavDragOverId(id);
  }
  async function handleNavDrop(targetId: string) {
    const fromId = navDragRef.current;
    setNavDragOverId(null);
    navDragRef.current = null;
    if (!fromId || fromId === targetId) return;
    const from = localNavItems.findIndex((item) => item.id === fromId);
    const to = localNavItems.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const previousOrder = localNavItems.map((item) => item.id);
    const next = [...localNavItems];
    const [dragged] = next.splice(from, 1);
    next.splice(to, 0, dragged);
    const nextOrder = next.map((item) => item.id);
    setNavOrder(nextOrder);
    setNavReorderPending(true);
    setNavReorderStatus("idle");
    const fd = new FormData();
    fd.append("locale", locale);
    fd.append("order", JSON.stringify(nextOrder));
    try {
      await reorderNavItemsAction(fd);
      setNavReorderStatus("success");
      setTimeout(() => setNavReorderStatus("idle"), 3000);
    } catch {
      setNavReorderStatus("error");
      setNavOrder(previousOrder);
      setTimeout(() => setNavReorderStatus("idle"), 5000);
    } finally {
      setNavReorderPending(false);
    }
  }
  function handleNavDragEnd() {
    navDragRef.current = null;
    setNavDragOverId(null);
  }

  function openSectionsFor(pageId: string) {
    const page = data.pages.find((p) => p.id === pageId);
    setSections(parseSections(page?.sections));
    setActiveSectionsPageId(pageId);
  }

  function addSection(type: SectionType) {
    setSections((prev) => [...prev, createDefaultSection(type)]);
  }

  function updateSection(id: string, updates: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...updates } as PageSection) : s)));
  }

  function updateSectionItem(sectionId: string, itemIndex: number, itemUpdates: Record<string, unknown>) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || !("items" in s)) return s;
        const items = [...(s.items as Record<string, unknown>[])];
        items[itemIndex] = { ...items[itemIndex], ...itemUpdates };
        return { ...s, items } as PageSection;
      })
    );
  }

  function addSectionItem(sectionId: string, defaultItem: Record<string, unknown>) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || !("items" in s)) return s;
        return { ...s, items: [...(s.items as unknown[]), defaultItem] } as PageSection;
      })
    );
  }

  function removeSectionItem(sectionId: string, itemIndex: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || !("items" in s)) return s;
        return { ...s, items: (s.items as unknown[]).filter((_, i) => i !== itemIndex) } as PageSection;
      })
    );
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function moveSection(id: string, dir: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  return (
    <div className="grid gap-5">
      {/* Navigation Management */}
      <Panel title="Navigation Menu" eyebrow="Site">
        <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
          <div>
            <p className="mb-3 text-sm text-muted">Add custom pages or external links to the navbar.</p>
            <form action={createNavItemAction} className="grid gap-3">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label (EN)"><Input name="labelEn" required placeholder="Services" /></Field>
                <Field label="Label (FR)"><Input name="labelFr" required placeholder="Services" /></Field>
              </div>
              <Field label="Path or URL"><Input name="href" required placeholder="/services or https://..." /></Field>
              <label className="flex items-center gap-2 text-sm text-primary">
                <input className="size-4 accent-cyan-400" type="checkbox" name="openNewTab" value="true" />
                Open in new tab
              </label>
              <SubmitButton>Add nav item</SubmitButton>
            </form>
          </div>
          <div className="grid gap-2 content-start">
            {navReorderStatus !== "idle" && (
              <div className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                navReorderStatus === "success" && "bg-emerald-500/10 text-emerald-400",
                navReorderStatus === "error" && "bg-red-500/10 text-red-400"
              )}>
                {navReorderStatus === "success" && <><CheckCircle2 className="size-3 shrink-0" /> Order saved</>}
                {navReorderStatus === "error" && <><X className="size-3 shrink-0" /> Failed to save order — reverted</>}
              </div>
            )}
            {localNavItems.map((item) => (
              <article
                key={item.id}
                draggable
                onDragStart={() => handleNavDragStart(item.id)}
                onDragOver={(e) => handleNavDragOver(e, item.id)}
                onDrop={() => handleNavDrop(item.id)}
                onDragEnd={handleNavDragEnd}
                className={cn(
                  "rounded-lg border border-border bg-background p-3 transition-colors",
                  navDragOverId === item.id && "border-accent/60 bg-accent/5 ring-1 ring-accent/30",
                  navReorderPending && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-muted active:cursor-grabbing" />
                    <div className="min-w-0">
                      <p className="font-semibold text-primary">{item.labelEn} <span className="text-muted">/</span> {item.labelFr}</p>
                      <p className="text-sm text-muted">{item.href}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Pill tone={item.visible ? "good" : "quiet"}>{item.visible ? "Visible" : "Hidden"}</Pill>
                  </div>
                </div>
                <details className="mt-2 rounded-lg border border-border bg-surface p-2">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">Edit</summary>
                  <div className="mt-3 grid gap-3">
                    <ActionForm action={updateNavItemAction} className="grid gap-3" successMessage="Nav item saved">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={item.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Label EN"><Input name="labelEn" defaultValue={item.labelEn} required /></Field>
                        <Field label="Label FR"><Input name="labelFr" defaultValue={item.labelFr} required /></Field>
                      </div>
                      <Field label="Path or URL"><Input name="href" defaultValue={item.href} required /></Field>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-primary">
                          <input
                            className="size-4 accent-cyan-400"
                            type="checkbox"
                            name="visible"
                            value="true"
                            defaultChecked={item.visible}
                          />
                          Visible in nav
                        </label>
                        <label className="flex items-center gap-2 text-sm text-primary">
                          <input
                            className="size-4 accent-cyan-400"
                            type="checkbox"
                            name="openNewTab"
                            value="true"
                            defaultChecked={item.openNewTab}
                          />
                          Open in new tab
                        </label>
                      </div>
                      <SubmitButton>Save changes</SubmitButton>
                    </ActionForm>
                    <form action={deleteNavItemAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm font-semibold text-red-400">Remove from nav</button>
                    </form>
                  </div>
                </details>
              </article>
            ))}
            {!localNavItems.length ? <EmptyState title="No nav items yet. Add one above." /> : null}
          </div>
        </div>
      </Panel>

      <Panel title="Customer Feedback" eyebrow="Moderation">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill tone="quiet">Total {data.stats.feedback ?? data.feedback.length}</Pill>
          <Pill tone="warn">Pending {data.stats.pendingFeedback ?? data.feedback.filter((item) => item.status === "PENDING").length}</Pill>
        </div>
        <div className="grid gap-3">
          {data.feedback.map((item) => (
            <FeedbackModerationCard key={item.id} item={item} locale={locale} />
          ))}
          {!data.feedback.length ? <EmptyState title="No feedback submissions yet." /> : null}
        </div>
      </Panel>

      <Panel title="Homepage FAQs" eyebrow="Bilingual content">
        <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
          <div>
            <ActionForm
              action={createHomepageFaqAction}
              className="grid gap-3"
              successMessage="FAQ created"
            >
              <input type="hidden" name="locale" value={locale} />
              <Field label="Question (EN)">
                <Input name="questionEn" required maxLength={180} />
              </Field>
              <Field label="Question (FR)">
                <Input name="questionFr" required maxLength={180} />
              </Field>
              <Field label="Answer (EN)">
                <Textarea name="answerEn" required className="min-h-24" />
              </Field>
              <Field label="Answer (FR)">
                <Textarea name="answerFr" required className="min-h-24" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Display order">
                  <Input
                    name="displayOrder"
                    type="number"
                    min={0}
                    defaultValue={data.faqs.length}
                  />
                </Field>
                <label className="flex items-center gap-2 self-end rounded-lg border border-border bg-background px-3 py-3 text-sm text-primary">
                  <input
                    type="checkbox"
                    name="showOnHomepage"
                    defaultChecked
                    className="size-4 accent-cyan-400"
                  />
                  Show on homepage
                </label>
              </div>
              <SubmitButton>Create FAQ</SubmitButton>
            </ActionForm>
          </div>

          <div className="grid gap-3">
            {data.faqs.map((item) => (
              <HomepageFaqCard key={item.id} item={item} locale={locale} />
            ))}
            {!data.faqs.length ? (
              <EmptyState title="No homepage FAQs yet." />
            ) : null}
          </div>
        </div>
      </Panel>

      {/* Pages */}
      <div className="grid gap-5 xl:grid-cols-[25rem_1fr]">
        <Panel title="Create Page" eyebrow="Content">
          <ActionForm action={createContentPageAction} className="grid gap-3" successMessage="Page created successfully">
            <input type="hidden" name="locale" value={locale} />
            <Field label="Slug"><Input name="slug" minLength={2} maxLength={120} placeholder="about, services/custom" /></Field>
            <Field label="Type"><Input name="type" defaultValue="page" required minLength={2} maxLength={80} /></Field>
            <Field label="Status"><Select name="status" defaultValue="DRAFT">{contentStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
            <Field label="Translation locale"><Select name="translationLocale" defaultValue="en"><option value="en">English</option><option value="fr">French</option></Select></Field>
            <Field label="Title"><Input name="title" required minLength={2} maxLength={180} /></Field>
            <Field label="Excerpt"><Textarea name="excerpt" maxLength={5000} /></Field>
            <Field label="Body"><Textarea name="body" required minLength={20} maxLength={30000} className="min-h-44" /></Field>
            <Field label="SEO title"><Input name="seoTitle" maxLength={180} /></Field>
            <Field label="SEO description"><Textarea name="seoDescription" maxLength={5000} /></Field>
            <SubmitButton>Create page</SubmitButton>
          </ActionForm>
        </Panel>

        <Panel title="Page Content" eyebrow="Translations & Sections">
          <div className="grid gap-4">
            {data.pages.map((page) => (
              <article key={page.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-primary">/{page.slug}</h3>
                      {page.status === "PUBLISHED" && (
                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-accent">
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted">{page.type} · Updated {formatDate(page.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={statusTone(page.status)}>{labelMap[page.status]}</Pill>
                    {page.translations.map((translation) => <Pill key={translation.id} tone="quiet">{translation.locale.toUpperCase()}</Pill>)}
                    <form action={updatePageStatusAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="pageId" value={page.id} />
                      {page.status !== "PUBLISHED" ? (
                        <>
                          <input type="hidden" name="status" value="PUBLISHED" />
                          <button type="submit" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">Publish</button>
                        </>
                      ) : (
                        <>
                          <input type="hidden" name="status" value="DRAFT" />
                          <button type="submit" className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">Unpublish</button>
                        </>
                      )}
                    </form>
                    <DeletePageButton pageId={page.id} locale={locale} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {page.translations.map((translation) => (
                    <div key={translation.id} className="rounded-lg border border-border bg-surface p-3">
                      <p className="text-sm font-semibold text-primary">{translation.title}</p>
                      <p className="text-xs text-muted">{translation.locale.toUpperCase()} · {translation.excerpt || "No excerpt"}</p>
                    </div>
                  ))}
                </div>

                <details className="mt-3 rounded-lg border border-border bg-surface p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-primary">Add or update translation</summary>
                  <ActionForm action={saveContentTranslationAction} className="mt-4 grid gap-3" successMessage="Translation saved">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="pageId" value={page.id} />
                    <Field label="Locale"><Select name="translationLocale" defaultValue="en"><option value="en">English</option><option value="fr">French</option></Select></Field>
                    <Field label="Title"><Input name="title" required minLength={2} maxLength={180} /></Field>
                    <Field label="Excerpt"><Textarea name="excerpt" maxLength={5000} /></Field>
                    <Field label="Body"><Textarea name="body" required minLength={20} maxLength={30000} className="min-h-36" /></Field>
                    <Field label="Meta title"><Input name="metaTitle" maxLength={180} /></Field>
                    <Field label="Meta description"><Textarea name="metaDescription" maxLength={5000} /></Field>
                    <SubmitButton>Save translation</SubmitButton>
                  </ActionForm>
                </details>

                <button
                  type="button"
                  onClick={() => activeSectionsPageId === page.id ? setActiveSectionsPageId(null) : openSectionsFor(page.id)}
                  className="mt-3 w-full rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent"
                >
                  {activeSectionsPageId === page.id ? "Close sections builder" : `Edit page sections (${parseSections(page.sections).length})`}
                </button>

                {activeSectionsPageId === page.id && (
                  <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                    <p className="mb-4 text-sm font-semibold text-primary">Page sections <span className="font-normal text-muted">— rendered on the live page before the body text</span></p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {(Object.keys(SECTION_LABELS) as SectionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addSection(type)}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent/10"
                        >
                          <Plus className="mr-1 inline size-3" />
                          {SECTION_LABELS[type]}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-3">
                      {sections.map((section, index) => (
                        <SectionEditorCard
                          key={section.id}
                          section={section}
                          isFirst={index === 0}
                          isLast={index === sections.length - 1}
                          isDragOver={sectionDragOverId === section.id}
                          onUpdate={(updates) => updateSection(section.id, updates)}
                          onRemove={() => removeSection(section.id)}
                          onMoveUp={() => moveSection(section.id, -1)}
                          onMoveDown={() => moveSection(section.id, 1)}
                          onAddItem={(defaultItem) => addSectionItem(section.id, defaultItem)}
                          onRemoveItem={(idx) => removeSectionItem(section.id, idx)}
                          onUpdateItem={(idx, updates) => updateSectionItem(section.id, idx, updates)}
                          onDragStart={() => handleSectionDragStart(section.id)}
                          onDragOver={(e) => handleSectionDragOver(e, section.id)}
                          onDrop={() => handleSectionDrop(section.id)}
                          onDragEnd={handleSectionDragEnd}
                        />
                      ))}
                      {!sections.length && <p className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">No sections yet. Add one above.</p>}
                    </div>
                    <ActionForm action={updatePageSectionsAction} className="mt-4" successMessage="Sections saved">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="pageId" value={page.id} />
                      <input type="hidden" name="sections" value={JSON.stringify(sections)} />
                      <SubmitButton>Save sections</SubmitButton>
                    </ActionForm>
                  </div>
                )}
              </article>
            ))}
            {!data.pages.length ? <EmptyState title="No managed pages yet." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FeedbackModerationCard({
  item,
  locale
}: {
  item: AdminDashboardData["feedback"][number];
  locale: Locale;
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateCustomerFeedbackAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCustomerFeedbackAction, null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-primary">{item.name}</p>
          <p className="text-xs text-muted">
            {[item.role, item.company, item.email].filter(Boolean).join(" · ") || "No profile details"}
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-primary">
            &quot;{item.quote}&quot;
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone={statusTone(item.status)}>{item.status}</Pill>
          {item.showOnHomepage ? <Pill tone="good">Homepage</Pill> : null}
          {item.showOnFounder ? <Pill tone="good">Founder</Pill> : null}
          {item.showOnPortfolio ? <Pill tone="good">Portfolio</Pill> : null}
          {item.rating ? <Pill tone="quiet">{item.rating}/5</Pill> : null}
        </div>
      </div>

      <form action={updateAction} className="mt-3 grid gap-3 rounded-lg border border-border bg-surface p-3">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Status">
            <Select name="status" defaultValue={item.status}>
              {feedbackStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Display order"><Input name="displayOrder" type="number" min={0} defaultValue={item.displayOrder} /></Field>
          <Field label="Linked project"><Input value={item.project?.title || "-"} disabled /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showOnHomepage" defaultChecked={item.showOnHomepage} className="size-4 accent-cyan-400" /> Show on homepage</label>
          <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showOnFounder" defaultChecked={item.showOnFounder} className="size-4 accent-cyan-400" /> Show on founder page</label>
          <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" name="showOnPortfolio" defaultChecked={item.showOnPortfolio} className="size-4 accent-cyan-400" /> Show on portfolio page</label>
        </div>
        <Field label="Internal notes"><Textarea name="internalNotes" defaultValue={item.internalNotes ?? ""} className="min-h-16" /></Field>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={updatePending} className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent disabled:opacity-60">
            {updatePending ? "Saving..." : "Save moderation"}
          </button>
          {updateState?.error ? <p className="text-xs text-red-400">{updateState.error}</p> : null}
          {updateState?.success ? <p className="text-xs text-emerald-400">Saved.</p> : null}
        </div>
      </form>

      <div className="mt-2">
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-red-400 hover:text-red-300">
            Delete feedback
          </button>
        ) : (
          <form action={deleteAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" disabled={deletePending} className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 disabled:opacity-60">
              {deletePending ? "Deleting..." : "Confirm delete"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-muted hover:text-primary">Cancel</button>
            {deleteState?.error ? <p className="w-full text-xs text-red-400">{deleteState.error}</p> : null}
          </form>
        )}
      </div>
    </article>
  );
}

function HomepageFaqCard({
  item,
  locale,
}: {
  item: AdminDashboardData["faqs"][number];
  locale: Locale;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateHomepageFaqAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteHomepageFaqAction,
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-primary">{item.questionEn}</p>
          <p className="mt-1 text-xs text-muted">{item.questionFr}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.showOnHomepage ? <Pill tone="good">Homepage</Pill> : null}
          <Pill tone="quiet">Order {item.displayOrder}</Pill>
        </div>
      </div>

      <form
        action={updateAction}
        className="mt-3 grid gap-3 rounded-lg border border-border bg-surface p-3"
      >
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Question (EN)">
            <Input name="questionEn" defaultValue={item.questionEn} required />
          </Field>
          <Field label="Question (FR)">
            <Input name="questionFr" defaultValue={item.questionFr} required />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Answer (EN)">
            <Textarea
              name="answerEn"
              defaultValue={item.answerEn}
              className="min-h-24"
              required
            />
          </Field>
          <Field label="Answer (FR)">
            <Textarea
              name="answerFr"
              defaultValue={item.answerFr}
              className="min-h-24"
              required
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Display order">
            <Input
              name="displayOrder"
              type="number"
              min={0}
              defaultValue={item.displayOrder}
            />
          </Field>
          <label className="flex items-center gap-2 self-end rounded-lg border border-border bg-background px-3 py-3 text-sm text-primary">
            <input
              type="checkbox"
              name="showOnHomepage"
              defaultChecked={item.showOnHomepage}
              className="size-4 accent-cyan-400"
            />
            Show on homepage
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={updatePending}
            className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent disabled:opacity-60"
          >
            {updatePending ? "Saving..." : "Save FAQ"}
          </button>
          {updateState?.error ? (
            <p className="text-xs text-red-400">{updateState.error}</p>
          ) : null}
          {updateState?.success ? (
            <p className="text-xs text-emerald-400">Saved.</p>
          ) : null}
        </div>
      </form>

      <div className="mt-2">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-semibold text-red-400 hover:text-red-300"
          >
            Delete FAQ
          </button>
        ) : (
          <form action={deleteAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 disabled:opacity-60"
            >
              {deletePending ? "Deleting..." : "Confirm delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-muted hover:text-primary"
            >
              Cancel
            </button>
            {deleteState?.error ? (
              <p className="w-full text-xs text-red-400">{deleteState.error}</p>
            ) : null}
          </form>
        )}
      </div>
    </article>
  );
}

function Processes({ data, locale, currentUser, canManage }: { data: AdminDashboardData; locale: Locale; currentUser: CurrentUser; canManage: boolean }) {
  // Filter boards: super_admin / users with processes.manage see all; others see only boards where their role is listed
  const visibleBoards = canManage
    ? data.boards
    : data.boards.filter((b) => b.viewerRoles.length === 0 || b.viewerRoles.includes(currentUser.role));

  return (
    <div className="grid gap-5">
      {canManage ? (
        <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
          <Panel title="Create Board" eyebrow="Workflow">
            <form action={createBoardAction} className="grid gap-3">
              <input type="hidden" name="locale" value={locale} />
              <Field label="Name"><Input name="name" required placeholder="Delivery OS" /></Field>
              <Field label="Status"><Select name="status" defaultValue="ACTIVE">{processStatuses.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
              <Field label="Description"><Textarea name="description" /></Field>
              <SubmitButton>Create board</SubmitButton>
            </form>
          </Panel>

          <Panel title="Workflow Health" eyebrow="Operations">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard icon={KanbanSquare} label="Boards" value={data.boards.length} detail="Active management boards" />
              <MetricCard icon={CheckCircle2} label="Tasks" value={data.stats.tasks} detail="Cards across workflows" />
              <MetricCard icon={BriefcaseBusiness} label="Client links" value={data.clients.length} detail="Available for task context" />
            </div>
          </Panel>
        </div>
      ) : null}

      {visibleBoards.map((board) => (
        <BoardPanel key={board.id} board={board} data={data} locale={locale} canManage={canManage} />
      ))}
      {!visibleBoards.length ? <EmptyState title={canManage ? "Create a workflow board to start managing delivery." : "No boards are assigned to your role yet."} /> : null}
    </div>
  );
}

function BoardPanel({ board, data, locale, canManage }: { board: AdminDashboardData["boards"][number]; data: AdminDashboardData; locale: Locale; canManage: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateState, updateFormAction, isUpdating] = useActionState(updateBoardAction, null);

  useEffect(() => {
    if (updateState?.success === true) queueMicrotask(() => setEditOpen(false));
  }, [updateState]);

  const boardKey = `${board.id}:${board.columns.map((c: { id: string; title: string; color: string | null }) => `${c.id}-${c.title}-${c.color}`).join("|")}.${board.tasks.map((t: { id: string; columnId: string; position: number; updatedAt: string | null }) => `${t.id}-${t.columnId}-${t.position}-${t.updatedAt}`).join("|")}`;

  // All role names for the viewerRoles selector
  const allRoleNames = data.roles.map((r) => ({ name: r.name, label: r.label }));

  return (
    <Panel
      title={board.name}
      eyebrow="Kanban"
      action={
        canManage ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary">
              <Edit2 className="size-3" /> Edit board
            </button>
            {!deleteConfirm ? (
              <button type="button" onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20">
                <Trash2 className="size-3" /> Delete
              </button>
            ) : (
              <form action={deleteBoardAction} className="flex items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={board.id} />
                <span className="text-xs text-red-400">Confirm?</span>
                <button type="submit" className="rounded-lg border border-red-500/40 bg-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-300">Yes, delete</button>
                <button type="button" onClick={() => setDeleteConfirm(false)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted">Cancel</button>
              </form>
            )}
          </div>
        ) : null
      }
    >
      {canManage && editOpen ? (
        <details open className="mb-5 rounded-lg border border-border bg-background p-4">
          <summary className="cursor-pointer text-sm font-semibold text-primary">Board settings</summary>
          <form action={updateFormAction} className="mt-4 grid gap-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={board.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input name="name" required defaultValue={board.name} /></Field>
              <Field label="Status"><Select name="status" defaultValue={board.status}>{processStatuses.map((s) => <option key={s} value={s}>{labelMap[s]}</option>)}</Select></Field>
            </div>
            <Field label="Description"><Textarea name="description" defaultValue={board.description || ""} /></Field>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Viewer roles (who can see this board)</p>
              <p className="mb-3 text-xs text-muted">If none selected, all admins can view. Admins with <em>processes.manage</em> always see all boards.</p>
              <div className="grid gap-1.5 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
                {allRoleNames.map((r) => (
                  <label key={r.name} className="flex items-center gap-2 text-sm text-primary">
                    <input className="size-4 accent-cyan-400" type="checkbox" name="viewerRoles" value={r.name} defaultChecked={board.viewerRoles.includes(r.name)} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            {updateState?.success === false && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{updateState.error}</p>
            )}
            <SubmitButton>{isUpdating ? "Saving…" : "Save board settings"}</SubmitButton>
          </form>
        </details>
      ) : null}

      {canManage ? (
        <form action={createTaskAction} className="mb-5 grid gap-3 rounded-lg border border-border bg-background p-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="boardId" value={board.id} />
          <Field label="Task"><Input name="title" required placeholder="Prepare proposal" /></Field>
          <Field label="Column"><Select name="columnId">{board.columns.map((column: { id: string; title: string }) => <option key={column.id} value={column.id}>{column.title}</option>)}</Select></Field>
          <Field label="Priority"><Select name="priority" defaultValue="MEDIUM">{priorities.map((item) => <option key={item} value={item}>{labelMap[item]}</option>)}</Select></Field>
          <div className="self-end max-xl:w-full"><SubmitButton>Add task</SubmitButton></div>
          <Field label="Client"><Select name="clientId"><option value="">None</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></Field>
          <Field label="Project"><Select name="projectId"><option value="">None</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</Select></Field>
          <Field label="Assignee"><Select name="assigneeId"><option value="">Unassigned</option>{data.admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name || admin.email}</option>)}</Select></Field>
          <Field label="Due"><DatePicker name="dueDate" /></Field>
          <div className="xl:col-span-4"><Field label="Description"><Textarea name="description" /></Field></div>
          <div className="xl:col-span-4"><Field label="Tags"><Input name="tags" placeholder="proposal, waiting, design" /></Field></div>
        </form>
      ) : null}

      <AdminKanbanBoard
        key={boardKey}
        board={board}
        locale={locale}
        canManage={canManage}
        admins={data.admins.map((a) => ({ id: a.id, name: a.name, email: a.email }))}
        clients={data.clients.map((c) => ({ id: c.id, name: c.name }))}
        projects={data.projects.map((p) => ({ id: p.id, title: p.title }))}
      />
    </Panel>
  );
}

function Access({ data, locale, roles, currentUser, canManageRoles }: { data: AdminDashboardData; locale: Locale; roles: AdminDashboardData["roles"]; currentUser: CurrentUser; canManageRoles: boolean }) {
  function canEditAdmin(admin: AdminDashboardData["admins"][number]) {
    return currentUser.roleLevel >= 100 || admin.roleLevel < currentUser.roleLevel;
  }
  function canEditRole(role: AdminDashboardData["roles"][number]) {
    return currentUser.roleLevel >= 100 || role.level < currentUser.roleLevel;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[25rem_1fr]">
      <div className="grid gap-5">
        <Panel title="Create Admin" eyebrow="Access">
          <form action={createAdminAction} className="grid gap-3">
            <input type="hidden" name="locale" value={locale} />
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Temporary password"><Input name="password" type="password" minLength={10} required /></Field>
            <Field label="Role">
              <Select name="roleId" required>
                <option value="">Select role</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.label} - level {role.level}</option>)}
              </Select>
            </Field>
            <SubmitButton>Create admin</SubmitButton>
          </form>
        </Panel>

        {canManageRoles ? (
          <Panel title="Create Role" eyebrow="Hierarchy">
            <form action={createRoleAction} className="grid gap-3">
              <input type="hidden" name="locale" value={locale} />
              <Field label="System name"><Input name="name" required placeholder="finance_manager" /></Field>
              <Field label="Label"><Input name="label" required placeholder="Finance Manager" /></Field>
              <Field label="Level"><Input name="level" type="number" min={1} max={currentUser.roleLevel >= 100 ? 100 : currentUser.roleLevel - 1} defaultValue={Math.max(1, Math.min(40, currentUser.roleLevel - 1))} required /></Field>
              <Field label="Description"><Textarea name="description" /></Field>
              <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Permissions</p>
                {ADMIN_PERMISSIONS.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-sm text-primary">
                    <input className="size-4 accent-cyan-400" type="checkbox" name="permissions" value={permission} />
                    {permissionLabels[permission]}
                  </label>
                ))}
              </div>
              <SubmitButton>Create role</SubmitButton>
            </form>
          </Panel>
        ) : null}
      </div>

      <div className="grid gap-5">
        <Panel title="Admins" eyebrow="Users">
          <div className="grid gap-3 lg:grid-cols-2">
            {data.admins.map((admin) => (
              <article key={admin.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent"><LockKeyhole className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-primary">{admin.name || admin.email}</h3>
                    <p className="break-all text-sm text-muted">{admin.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="quiet">{admin.role}</Pill>
                      <Pill tone={statusTone(admin.status)}>{labelMap[admin.status] || admin.status}</Pill>
                    </div>
                    <p className="mt-3 text-xs text-muted">Last login: {formatDate(admin.lastLoginAt)}</p>
                  </div>
                </div>

                {canEditAdmin(admin) ? (
                  <details className="mt-3 rounded-lg border border-border bg-surface p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">Edit admin</summary>
                    <form action={updateAdminAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={admin.id} />
                      <Field label="Name"><Input name="name" required defaultValue={admin.name || ""} /></Field>
                      <Field label="Email"><Input name="email" type="email" required defaultValue={admin.email} /></Field>
                      <Field label="Status">
                        <Select name="status" defaultValue={admin.status}>
                          {adminStatuses.map((s) => <option key={s} value={s}>{labelMap[s]}</option>)}
                        </Select>
                      </Field>
                      <Field label="Role">
                        <Select name="roleId" required defaultValue={admin.roleId || ""}>
                          <option value="">Select role</option>
                          {roles.map((r) => <option key={r.id} value={r.id}>{r.label} - level {r.level}</option>)}
                        </Select>
                      </Field>
                      <SubmitButton>Save changes</SubmitButton>
                    </form>
                  </details>
                ) : null}

                {canEditAdmin(admin) && admin.id !== currentUser.id ? (
                  <details className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-red-400">Delete admin</summary>
                    <form action={deleteAdminAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={admin.id} />
                      <p className="text-sm text-muted">This will permanently remove <strong className="text-primary">{admin.name || admin.email}</strong> and cannot be undone.</p>
                      <button type="submit" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
                        Delete {admin.name || admin.email}
                      </button>
                    </form>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>

        {canManageRoles ? (
          <Panel title="Roles" eyebrow="Permissions">
            <div className="grid gap-3 lg:grid-cols-2">
              {data.roles.map((role) => (
                <article key={role.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-primary">{role.label}</h3>
                      <p className="text-sm text-muted">{role.description || "No description"}</p>
                    </div>
                    <Pill tone={role.level >= 90 ? "warn" : "quiet"}>L{role.level}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="default">{role.users} users</Pill>
                    {role.permissions.slice(0, 5).map((permission) => <Pill key={permission} tone="quiet">{permissionLabels[permission as AdminPermission] || permission}</Pill>)}
                  </div>

                  {canEditRole(role) ? (
                    <details className="mt-3 rounded-lg border border-border bg-surface p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-primary">Edit role</summary>
                      <form action={updateRoleAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={role.id} />
                        <Field label="Label"><Input name="label" required defaultValue={role.label} /></Field>
                        <Field label="Level"><Input name="level" type="number" min={1} max={currentUser.roleLevel >= 100 ? 100 : currentUser.roleLevel - 1} defaultValue={role.level} required /></Field>
                        <Field label="Description"><Textarea name="description" defaultValue={role.description || ""} /></Field>
                        <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Permissions</p>
                          {ADMIN_PERMISSIONS.map((permission) => (
                            <label key={permission} className="flex items-center gap-2 text-sm text-primary">
                              <input
                                className="size-4 accent-cyan-400"
                                type="checkbox"
                                name="permissions"
                                value={permission}
                                defaultChecked={role.permissions.includes(permission)}
                              />
                              {permissionLabels[permission]}
                            </label>
                          ))}
                        </div>
                        <SubmitButton>Save changes</SubmitButton>
                      </form>
                    </details>
                  ) : null}

                  {canEditRole(role) ? (
                    <details className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-red-400">Delete role</summary>
                      <form action={deleteRoleAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={role.id} />
                        {role.users > 0 ? (
                          <p className="text-sm text-muted">Cannot delete: <strong className="text-primary">{role.users}</strong> user(s) are assigned. Reassign them first.</p>
                        ) : (
                          <>
                            <p className="text-sm text-muted">This will permanently delete the <strong className="text-primary">{role.label}</strong> role and cannot be undone.</p>
                            <button type="submit" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
                              Delete {role.label}
                            </button>
                          </>
                        )}
                      </form>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Roles" eyebrow="Permissions">
            <div className="grid gap-3 lg:grid-cols-2">
              {data.roles.map((role) => (
                <article key={role.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-primary">{role.label}</h3>
                      <p className="text-sm text-muted">{role.description || "No description"}</p>
                    </div>
                    <Pill tone={role.level >= 90 ? "warn" : "quiet"}>L{role.level}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone="default">{role.users} users</Pill>
                    {role.permissions.slice(0, 5).map((permission) => <Pill key={permission} tone="quiet">{permissionLabels[permission as AdminPermission] || permission}</Pill>)}
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Audit({ data }: { data: AdminDashboardData }) {
  return (
    <Panel title="Audit Trail" eyebrow="Security">
      <div className="grid gap-3">
        {data.auditLogs.map((log) => (
          <article key={log.id} className="grid gap-2 rounded-lg border border-border bg-background p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="font-semibold text-primary">{log.action}</h3>
              <p className="text-sm text-muted">{log.actor} · {log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p>
            </div>
            <p className="text-sm text-muted">{formatDate(log.createdAt)}</p>
          </article>
        ))}
        {!data.auditLogs.length ? <EmptyState title="No audit logs yet." /> : null}
      </div>
    </Panel>
  );
}
