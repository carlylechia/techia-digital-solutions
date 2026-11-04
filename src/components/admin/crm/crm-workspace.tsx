"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Globe,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import {
  createCrmContactAction,
  sendCrmMessageAction,
  type CrmFormState,
} from "@/app/[locale]/admin/crm/actions";
import type { Locale } from "@/content/site";
import { cn } from "@/lib/utils";
import type { CrmContact, CrmWorkspaceData } from "@/lib/crm/types";
import { AiEmailAssistant } from "@/components/admin/ai-email-assistant";
import { OutreachPanel, OutreachPill, OutreachStatCard } from "@/components/admin/outreach/outreach-ui";

function formatDateTime(value: string | null) {
  if (!value) return "No messages yet";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

const inputClass = "form-input text-sm";

function ContactListItem({
  contact,
  active,
  onClick,
}: {
  contact: CrmContact;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition",
        active
          ? "border-accent/50 bg-accent/10"
          : "border-border bg-background hover:border-accent/30 hover:bg-surface"
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-primary">{contact.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {contact.role ? `${contact.role} · ` : ""}
            {contact.clientName}
          </span>
        </span>
        {contact.isPrimary ? <OutreachPill tone="quiet">Primary</OutreachPill> : null}
      </span>
      <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="truncate">{contact.email || contact.phone || "No contact details"}</span>
        <span className="shrink-0">{contact.messages.length > 0 ? `${contact.messages.length} msg` : "New"}</span>
      </span>
      <span className="mt-1 block truncate text-[11px] text-muted">{formatDateTime(contact.lastMessageAt)}</span>
    </button>
  );
}

export function CrmWorkspace({ locale, data }: { locale: Locale; data: CrmWorkspaceData }) {
  const router = useRouter();
  const initialContact = data.contacts[0] ?? null;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialContact?.id ?? null);
  const [showAdd, setShowAdd] = useState(data.contacts.length === 0);
  const [addClientChoice, setAddClientChoice] = useState("");
  const [showInbound, setShowInbound] = useState(false);

  const [to, setTo] = useState(initialContact?.email ?? "");
  const [subject, setSubject] = useState(
    initialContact?.conversationSubject ? `Re: ${initialContact.conversationSubject}` : ""
  );
  const [body, setBody] = useState("");
  const [inboundFrom, setInboundFrom] = useState(initialContact?.email ?? "");
  const [inboundSubject, setInboundSubject] = useState("");
  const [inboundBody, setInboundBody] = useState("");

  const resetComposer = useCallback((contact: CrmContact | null) => {
    setTo(contact?.email ?? "");
    setSubject(contact?.conversationSubject ? `Re: ${contact.conversationSubject}` : "");
    setBody("");
    setInboundFrom(contact?.email ?? "");
    setInboundSubject("");
    setInboundBody("");
    setShowInbound(false);
  }, []);

  // Form resets happen inside the action wrappers (not in effects), so a
  // successful send can never leave the same message in the compose box.
  const [addState, addAction, addPending] = useActionState<CrmFormState, FormData>(
    async (previous, formData) => {
      const result = await createCrmContactAction(previous, formData);
      if (result?.success) {
        setShowAdd(false);
        setAddClientChoice("");
        if (result.contactId) {
          setSelectedId(result.contactId);
          resetComposer(null);
        }
        router.refresh();
      }
      return result;
    },
    null
  );
  const selected = useMemo(
    () => data.contacts.find((contact) => contact.id === selectedId) ?? data.contacts[0] ?? null,
    [data.contacts, selectedId]
  );

  const [sendState, sendAction, sendPending] = useActionState<CrmFormState, FormData>(
    async (previous, formData) => {
      const result = await sendCrmMessageAction(previous, formData);
      if (result?.success) {
        resetComposer(selected);
        router.refresh();
      }
      return result;
    },
    null
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.contacts;
    return data.contacts.filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.clientName, contact.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [data.contacts, search]);

  const selectContact = (contact: CrmContact) => {
    setSelectedId(contact.id);
    resetComposer(contact);
  };

  const aiContext = selected
    ? [
        `Contact: ${selected.name}`,
        selected.role ? `Role: ${selected.role}` : null,
        selected.email ? `Email: ${selected.email}` : null,
        selected.phone ? `Phone: ${selected.phone}` : null,
        `Client: ${selected.clientName}`,
        selected.clientIndustry ? `Industry: ${selected.clientIndustry}` : null,
        selected.clientCity || selected.clientCountry
          ? `Location: ${[selected.clientCity, selected.clientCountry].filter(Boolean).join(", ")}`
          : null,
        selected.clientWebsite ? `Website: ${selected.clientWebsite}` : null,
        selected.notes ? `Notes: ${selected.notes}` : null,
        selected.conversationSubject ? `Thread subject: ${selected.conversationSubject}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OutreachStatCard label="Contacts" value={data.stats.totalContacts} />
        <OutreachStatCard label="With email" value={data.stats.contactsWithEmail} tone="good" />
        <OutreachStatCard label="Clients" value={data.stats.totalClients} />
        <OutreachStatCard label="Open threads" value={data.stats.threads} hint="Conversations with at least one message" />
      </div>

      {showAdd ? (
        <OutreachPanel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-primary">Add a contact</h2>
              <p className="mt-1 text-sm text-muted">
                Add someone to an existing client, or create a new prospect record and start a thread.
              </p>
            </div>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg p-2 text-muted hover:text-primary">
              <X className="size-4" />
            </button>
          </div>

          <form action={addAction} className="mt-4 grid gap-4">
            <input type="hidden" name="locale" value={locale} />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Client">
                <select
                  name="clientId"
                  value={addClientChoice}
                  onChange={(event) => setAddClientChoice(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Create a new client / prospect</option>
                  {data.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.contactCount} contact{client.contactCount === 1 ? "" : "s"})
                    </option>
                  ))}
                </select>
              </Field>
              {!addClientChoice ? (
                <Field label="New client name" hint="Leave blank to use the contact name.">
                  <input name="clientName" className={inputClass} placeholder="Company or client name" />
                </Field>
              ) : null}
            </div>

            {!addClientChoice ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Client email">
                  <input name="clientEmail" type="email" className={inputClass} placeholder="hello@company.com" />
                </Field>
                <Field label="Client phone">
                  <input name="clientPhone" className={inputClass} placeholder="+237 ..." />
                </Field>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact name">
                <input name="contactName" required className={inputClass} placeholder="Full name" />
              </Field>
              <Field label="Role">
                <input name="contactRole" className={inputClass} placeholder="Owner, marketing lead..." />
              </Field>
              <Field label="Contact email" hint="Required to send email from the CRM.">
                <input name="contactEmail" type="email" className={inputClass} placeholder="name@company.com" />
              </Field>
              <Field label="Contact phone">
                <input name="contactPhone" className={inputClass} placeholder="+237 ..." />
              </Field>
            </div>

            <Field label="Notes">
              <textarea name="notes" rows={2} className={inputClass} placeholder="Context, preferences, how you met..." />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={addPending}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#001018] transition hover:opacity-90 disabled:opacity-60"
              >
                {addPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Add contact
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-muted hover:text-primary">
                Cancel
              </button>
            </div>
            {addState?.error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{addState.error}</p> : null}
            {addState?.success ? <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">Contact added.</p> : null}
          </form>
        </OutreachPanel>
      ) : null}

      <OutreachPanel>
        <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="grid content-start gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Contacts</h2>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
              >
                <Plus className="size-3.5" /> Add
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="Search name, company or email"
              />
            </div>

            <div className="grid max-h-[34rem] gap-2 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-background p-4 text-xs text-muted">
                  {data.contacts.length === 0 ? "No contacts yet. Add your first one above." : "No contacts match this search."}
                </p>
              ) : null}
              {filtered.map((contact) => (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  active={selected?.id === contact.id}
                  onClick={() => selectContact(contact)}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            {!selected ? (
              <div className="grid h-full min-h-64 place-items-center rounded-xl border border-dashed border-border bg-background p-6 text-center">
                <div>
                  <UserRound className="mx-auto size-8 text-muted" />
                  <p className="mt-3 text-sm font-semibold text-primary">No contact selected</p>
                  <p className="mt-1 text-sm text-muted">Add a contact, then start a conversation from here.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-primary">{selected.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {selected.role ? `${selected.role} · ` : ""}
                      {selected.clientName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      {selected.email ? (
                        <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 text-accent hover:underline">
                          <Mail className="size-3.5" /> {selected.email}
                        </a>
                      ) : null}
                      {selected.phone ? (
                        <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                          <Phone className="size-3.5" /> {selected.phone}
                        </a>
                      ) : null}
                      {selected.clientWebsite ? (
                        <a
                          href={selected.clientWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                        >
                          <Globe className="size-3.5" /> Website
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <OutreachPill tone={selected.email ? "good" : "warn"}>{selected.email ? "Emailable" : "No email"}</OutreachPill>
                </div>

                <div className="rounded-xl border border-border bg-background">
                  <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <MessageSquare className="size-4 text-accent" /> Conversation
                    </p>
                    <span className="text-xs text-muted">{formatDateTime(selected.lastMessageAt)}</span>
                  </div>
                  <div className="grid max-h-72 gap-3 overflow-y-auto p-4">
                    {selected.messages.length === 0 ? (
                      <p className="text-xs text-muted">
                        No messages yet. Draft a first message below, or paste a received email to reply to it.
                      </p>
                    ) : null}
                    {selected.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-xl border p-3 text-sm",
                          message.direction === "outbound"
                            ? "border-accent/20 bg-accent/10 min-[520px]:ml-6"
                            : "border-border bg-surface min-[520px]:mr-6"
                        )}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span className="inline-flex items-center gap-1 font-semibold text-primary">
                            {message.direction === "outbound" ? <Mail className="size-3" /> : <Inbox className="size-3" />}
                            {message.direction === "outbound" ? "teChia" : message.from}
                          </span>
                          <span>{formatDateTime(message.sentAt)}</span>
                          <span className="rounded-full border border-border px-2 py-0.5">{message.channel}</span>
                        </div>
                        {message.subject ? <p className="mb-1 font-medium text-primary">{message.subject}</p> : null}
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-muted">{message.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">Send a message</p>
                    <button
                      type="button"
                      onClick={() => setShowInbound((value) => !value)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:text-primary"
                    >
                      <Inbox className="size-3.5" />
                      {showInbound ? "Hide received email" : "Paste received email"}
                    </button>
                  </div>

                  <form action={sendAction} className="mt-3 grid gap-3">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="contactId" value={selected.id} />

                    {showInbound ? (
                      <div className="grid gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Received email to log with this reply</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Field label="From">
                            <input
                              name="inboundFrom"
                              value={inboundFrom}
                              onChange={(event) => setInboundFrom(event.target.value)}
                              className={inputClass}
                              placeholder="their@email.com"
                            />
                          </Field>
                          <Field label="Subject">
                            <input
                              name="inboundSubject"
                              value={inboundSubject}
                              onChange={(event) => setInboundSubject(event.target.value)}
                              className={inputClass}
                              placeholder="Their subject"
                            />
                          </Field>
                        </div>
                        <textarea
                          name="inboundBody"
                          value={inboundBody}
                          onChange={(event) => setInboundBody(event.target.value)}
                          rows={4}
                          className={inputClass}
                          placeholder="Paste the full email you received..."
                        />
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="To">
                        <input
                          name="to"
                          type="email"
                          required
                          value={to}
                          onChange={(event) => setTo(event.target.value)}
                          className={inputClass}
                          placeholder="name@company.com"
                        />
                      </Field>
                      <Field label="Subject">
                        <input
                          name="subject"
                          required
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          className={inputClass}
                          placeholder="Subject"
                        />
                      </Field>
                    </div>

                    <Field label="Message">
                      <textarea
                        name="body"
                        required
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={7}
                        className={inputClass}
                        placeholder={`Hi ${selected.name.split(" ")[0] || "there"},\n\n...`}
                      />
                    </Field>

                    <AiEmailAssistant
                      locale={locale}
                      contactName={selected.name}
                      contactEmail={selected.email}
                      companyName={selected.clientName}
                      clientName={selected.clientName}
                      context={aiContext}
                      inboundSubject={inboundSubject || undefined}
                      history={selected.messages.map((message) => ({
                        direction: message.direction,
                        subject: message.subject,
                        body: message.body,
                        sentAt: message.sentAt,
                      }))}
                      onDraft={(draft) => {
                        setSubject(draft.subject);
                        setBody(draft.body);
                        if (draft.inboundBody) {
                          setInboundBody(draft.inboundBody);
                          setShowInbound(true);
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={sendPending || !selected.email}
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#001018] transition hover:opacity-90 disabled:opacity-60"
                        title={!selected.email ? "Add an email address before sending." : undefined}
                      >
                        {sendPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        Send email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubject("");
                          setBody("");
                          setInboundBody("");
                          setInboundSubject("");
                          setShowInbound(false);
                        }}
                        className="text-sm text-muted hover:text-primary"
                      >
                        Clear
                      </button>
                      {!selected.email ? <span className="text-xs text-amber-300">This contact has no email address.</span> : null}
                    </div>

                    {sendState?.error ? (
                      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{sendState.error}</p>
                    ) : null}
                    {sendState?.success ? (
                      <p className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Email sent and added to the conversation. The compose fields were cleared.
                      </p>
                    ) : null}
                  </form>
                </div>

                {selected.notes ? (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      <Building2 className="size-3.5" /> Notes
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{selected.notes}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </OutreachPanel>
    </div>
  );
}
