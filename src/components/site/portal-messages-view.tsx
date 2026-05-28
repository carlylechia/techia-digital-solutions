"use client";

import { useState, useTransition } from "react";
import { MessageCircleMore, Send, ChevronDown, ChevronUp } from "lucide-react";
import type { PortalMessage } from "@/lib/portal-data";
import type { PortalSession } from "@/lib/portal-auth";
import { sendPortalReplyAction, markMessageReadAction } from "@/app/client-portal/actions";
import { usePortalLocale } from "@/lib/portal-locale-context";
import { timeAgoPortal } from "@/lib/portal-i18n";

function MessageThread({
  message,
  session,
}: {
  message: PortalMessage;
  session: PortalSession;
}) {
  const { locale, t } = usePortalLocale();
  const [open, setOpen] = useState(!message.readAt && message.fromAdmin);
  const [replyBody, setReplyBody] = useState("");
  const [sending, startSending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleToggle() {
    setOpen((v) => !v);
    if (!message.readAt && message.fromAdmin) {
      markMessageReadAction(message.id);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setError(null);

    const fd = new FormData();
    fd.set("messageId", message.id);
    fd.set("body", replyBody.trim());

    startSending(async () => {
      const res = await sendPortalReplyAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setReplyBody("");
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      }
    });
  }

  const isUnread = !message.readAt && message.fromAdmin;

  return (
    <article className={`rounded-xl border transition-colors ${isUnread ? "border-cyan-500/30 bg-cyan-500/[0.03]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      {/* Header */}
      <button
        type="button"
        className="flex w-full flex-wrap items-start gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5"
        onClick={handleToggle}
      >
        {/* Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-xs font-bold text-white sm:size-9">
          T
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">
              {message.admin?.name || t.messages.teChiaTeam}
            </span>
            {isUnread && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                {t.messages.newBadge}
              </span>
            )}
            {message.replies.length > 0 && (
              <span className="text-xs text-slate-500">
                {t.messages.replies(message.replies.length)}
              </span>
            )}
          </div>
          <p className="mt-0.5 break-words text-sm font-medium text-white">{message.subject}</p>
          {!open && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{message.body}</p>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <span className="text-xs text-slate-500">{timeAgoPortal(message.createdAt, locale)}</span>
          {open ? (
            <ChevronUp className="size-4 text-slate-500" />
          ) : (
            <ChevronDown className="size-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded thread */}
      {open && (
        <div className="border-t border-white/[0.06]">
          {/* Original message */}
          <div className="px-4 py-4 sm:px-5">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                {message.body}
              </p>
              <p className="mt-3 text-xs text-slate-600">{timeAgoPortal(message.createdAt, locale)}</p>
            </div>
          </div>

          {/* Replies */}
          {message.replies.length > 0 && (
            <div className="grid gap-3 px-4 pb-4 sm:px-5">
              {message.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex items-start gap-3 ${reply.fromAdmin ? "" : "flex-row-reverse"}`}
                >
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${reply.fromAdmin ? "bg-gradient-to-br from-cyan-600 to-blue-700" : "bg-gradient-to-br from-violet-600 to-purple-700"}`}>
                    {reply.fromAdmin ? "T" : session.clientName[0].toUpperCase()}
                  </div>
                  <div
                    className={`w-fit min-w-0 max-w-full rounded-xl px-4 py-2.5 break-words sm:max-w-[80%] ${reply.fromAdmin ? "border border-white/[0.07] bg-white/[0.05]" : "border border-cyan-500/20 bg-gradient-to-br from-cyan-600/20 to-blue-600/20"}`}
                  >
                    <p className="text-xs font-semibold mb-1 text-slate-400">
                      {reply.fromAdmin ? (reply.admin?.name || t.messages.teChiaTeam) : t.messages.you}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-200">
                      {reply.body}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{timeAgoPortal(reply.createdAt, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          <div className="border-t border-white/[0.06] px-4 py-4 sm:px-5">
            <form onSubmit={handleReply} className="grid gap-3">
              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
              {sent && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {t.messages.replySent}
                </p>
              )}
              <div className="flex gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-xs font-bold text-white mt-1">
                  {session.clientName[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={t.messages.replyPlaceholder}
                    rows={3}
                    maxLength={5000}
                    disabled={sending}
                    className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">{replyBody.length}/5000</span>
                    <button
                      type="submit"
                      disabled={sending || !replyBody.trim()}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 min-[420px]:w-auto"
                    >
                      <Send className="size-3" />
                      {sending ? t.messages.sending : t.messages.sendReply}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}

export function PortalMessagesView({
  messages,
  session,
}: {
  messages: PortalMessage[];
  session: PortalSession;
}) {
  const { t } = usePortalLocale();
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] py-16">
        <MessageCircleMore className="size-10 text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-400">{t.messages.empty}</p>
        <p className="mt-1 text-xs text-slate-600">{t.messages.emptyNote}</p>
      </div>
    );
  }

  const unread = messages.filter((m) => !m.readAt && m.fromAdmin);
  const read = messages.filter((m) => m.readAt || !m.fromAdmin);

  return (
    <div className="grid gap-4">
      {unread.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-cyan-400/70">
            {t.messages.unreadSection(unread.length)}
          </p>
          <div className="grid gap-3">
            {unread.map((m) => (
              <MessageThread key={m.id} message={m} session={session} />
            ))}
          </div>
        </div>
      )}
      {read.length > 0 && (
        <div>
          {unread.length > 0 && (
            <p className="mb-3 mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
              {t.messages.earlierSection}
            </p>
          )}
          <div className="grid gap-3">
            {read.map((m) => (
              <MessageThread key={m.id} message={m} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
