"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { DemoDefinition } from "@/content/demo-lab";
import { DemoRequestForm } from "./demo-request-form";

type Locale = "en" | "fr";

interface DemoRequestModalProps {
  demo: DemoDefinition;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}

export function DemoRequestModal({ demo, locale, open, onClose }: DemoRequestModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape key
  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    firstFocusRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const modal = overlayRef.current;
      if (!modal) return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const title = locale === "fr" ? "Créer un système comme celui-ci" : "Build Something Like This";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={overlayRef}
        className="relative z-10 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
          <div className="min-w-0">
            <p className="eyebrow text-xs">{demo.eyebrow[locale]}</p>
            <h2 id="demo-modal-title" className="truncate text-lg font-bold text-primary">
              {title}
            </h2>
          </div>
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            aria-label={locale === "fr" ? "Fermer" : "Close"}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted hover:bg-background hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <DemoRequestForm demo={demo} locale={locale} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
