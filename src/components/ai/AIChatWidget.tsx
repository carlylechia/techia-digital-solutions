"use client";

import { useEffect, useState } from "react";
import { AIChatPanel } from "./AIChatPanel";
import { MessageCircleMore, Sparkles, X } from "lucide-react";

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel */}
      <div
        className={[
          "fixed z-50 transition-all duration-300",
          "bottom-0 left-0 right-0 sm:bottom-20 sm:right-4 sm:left-auto",
          "sm:w-[400px]",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="teChia AI Growth Agent"
      >
        <AIChatPanel onClose={() => setIsOpen(false)} />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={[
          "group fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center",
          "rounded-full transition-transform duration-200 hover:scale-[1.03] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        ].join(" ")}
        aria-label={isOpen ? "Close AI assistant" : "Open teChia AI Growth Agent"}
        aria-describedby="ai-chat-widget-tooltip"
        data-ai-chat-trigger="true"
      >
        <span
          className={[
            "absolute inset-0 rounded-full bg-gradient-to-br shadow-[0_18px_50px_rgba(34,211,238,0.24)] transition-opacity duration-200",
            isOpen ? "from-surface via-surface to-surface opacity-100" : "from-cyan-400 via-blue-500 to-fuchsia-500 opacity-100",
          ].join(" ")}
        />
        <span
          className={[
            "absolute inset-[2px] rounded-full border backdrop-blur-xl transition-colors duration-200",
            isOpen ? "border-border bg-[#07111f]/95 text-muted" : "border-white/15 bg-[#07111f]/96 text-white",
          ].join(" ")}
        />
        <span className="relative flex h-full w-full items-center justify-center">
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircleMore className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-[#08111c] shadow-[0_4px_14px_rgba(251,191,36,0.45)]">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          )}
        </span>
        <span
          id="ai-chat-widget-tooltip"
          className={[
            "pointer-events-none absolute right-full mr-3 hidden w-56 rounded-2xl border border-white/10 bg-[#07111f]/95 px-3 py-2 text-left text-[11px] leading-5 text-slate-200 shadow-2xl backdrop-blur-xl",
            "group-hover:block group-focus-visible:block",
            isOpen ? "top-1/2 -translate-y-1/2" : "top-0",
          ].join(" ")}
        >
          {isOpen
            ? "Close the AI assistant."
            : "Chat with the AI Growth Agent for quick guidance on websites, systems, automation, and AI tools."}
        </span>
      </button>
    </>
  );
}
