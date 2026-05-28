"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/site/footer";
import { GradientOrb } from "@/components/site/gradient-orb";
import { Navbar } from "@/components/site/navbar";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { PublicScrollEffects } from "@/components/site/public-scroll-effects";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-frame relative min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <PublicScrollEffects />
      <GradientOrb color="cyan" className="-left-24 top-0 h-72 w-72" />
      <GradientOrb color="violet" className="right-0 top-32 h-80 w-80" />
      <Navbar />
      {children}
      <Footer />
      <AIChatWidget />
    </div>
  );
}
