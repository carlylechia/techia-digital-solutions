"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleMore, Sparkles } from "lucide-react";
import { openAIChatWidget } from "@/lib/ai/open-chat";

export function AIChatCTA() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={() => openAIChatWidget()}
        className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-all shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        Start chatting now
        <ArrowRight className="h-4 w-4" />
      </button>
      <Link
        href="/request-quote"
        className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-primary hover:border-accent hover:text-accent transition-all"
      >
        Request a quote instead
      </Link>
    </div>
  );
}

export function AIChatBottomCTA() {
  return (
    <button
      onClick={() => openAIChatWidget()}
      className="flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-sm font-semibold text-white hover:bg-accent/90 transition-all shadow-sm"
    >
      <MessageCircleMore className="h-4 w-4" />
      Start the conversation
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
