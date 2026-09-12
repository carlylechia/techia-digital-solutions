"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemoDefinition } from "@/content/demo-lab";
import { demoLabUi } from "@/content/demo-lab";
import { DemoRequestModal } from "@/components/demos/demo-request-modal";
import { ExternalLink } from "lucide-react";

type Locale = "en" | "fr";

interface DemoDetailCtaBarProps {
  demo: DemoDefinition;
  locale: Locale;
}

export function DemoDetailCtaBar({ demo, locale }: DemoDetailCtaBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const ui = demoLabUi[locale];

  return (
    <>
      <div className="sticky bottom-4 z-30 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-surface/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
          <span className="hidden text-sm font-semibold text-primary sm:block">{demo.shortTitle[locale]}</span>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("techia:analytics", {
                detail: { name: "demo_request_opened", params: { demo: demo.slug, locale, source: "sticky_bar" } }
              }));
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            <ExternalLink className="size-4" />
            {ui.buildLikeThis}
          </button>
          <Link
            href="/start-project"
            className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {ui.talkToTechia}
          </Link>
        </div>
      </div>

      <DemoRequestModal
        demo={demo}
        locale={locale}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
