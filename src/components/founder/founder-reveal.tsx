"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "jump" | "glide" | "float";

const revealStates: Record<RevealVariant, { hidden: Record<string, string | number>; visible: Record<string, string | number> }> = {
  jump: {
    hidden: { opacity: 0, y: 76, scale: 0.94, filter: "blur(12px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
  },
  glide: {
    hidden: { opacity: 0, y: 34, scale: 0.985, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
  },
  float: {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 }
  }
};

export function FounderReveal({
  children,
  className,
  delay = 0,
  variant = "jump",
  once = true,
  threshold = 0.2
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  once?: boolean;
  threshold?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, reduceMotion, threshold]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const state = revealStates[variant];

  return (
    <motion.div
      ref={ref}
      initial={state.hidden}
      animate={visible ? state.visible : state.hidden}
      transition={{
        type: "spring",
        stiffness: 135,
        damping: 20,
        mass: 0.85,
        delay
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
