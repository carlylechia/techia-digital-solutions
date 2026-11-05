"use client";

import { useEffect, useState } from "react";

export function PublicScrollEffects() {
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgress(next);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      media.removeEventListener("change", updatePreference);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
        style={{ transform: reduceMotion ? "none" : `scaleX(${progress})` }}
      />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="absolute right-[-4rem] top-[34vh] h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_58%)]" />
    </div>
  );
}
