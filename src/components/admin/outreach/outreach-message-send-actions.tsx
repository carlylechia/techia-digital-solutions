"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { instantSendOutreachMessage } from "@/app/[locale]/admin/outreach/actions";
import { OutreachButton } from "./outreach-ui";
import { ProfessionalLoader, StatusBanner } from "@/components/ui/professional-loader";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Per-message send controls. Each generated draft can be sent independently,
 * so a follow-up that is still pending is never blocked by an earlier message
 * that has already been delivered.
 */
export function OutreachMessageSendActions({
  prospectId,
  messageId,
  status,
  phone,
  body,
  canSend,
}: {
  prospectId: string;
  messageId: string;
  status: string;
  phone: string | null;
  body: string;
  canSend: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  const sendable = ["APPROVED", "PENDING_APPROVAL", "QUEUED"].includes(status);

  function sendNow() {
    setFeedback(null);
    startTransition(async () => {
      const result = await instantSendOutreachMessage({ prospectId, messageId });
      setTone(result.ok ? "success" : "error");
      setFeedback(result.ok ? result.message : result.error);
      if (result.ok) router.refresh();
    });
  }

  if (!sendable) return null;

  return (
    <div className="relative mt-2 flex flex-wrap items-center gap-2">
      <OutreachButton
        type="button"
        tone="good"
        disabled={pending || !canSend}
        onClick={sendNow}
      >
        {pending ? "Sending…" : "📤 Send now"}
      </OutreachButton>
      {phone ? (
        <a
          href={whatsappLink(phone, body)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          💬 WhatsApp
        </a>
      ) : null}
      {pending ? <ProfessionalLoader variant="overlay" label="Sending…" /> : null}
      {feedback ? <StatusBanner tone={tone} message={feedback} className="w-full" /> : null}
    </div>
  );
}
