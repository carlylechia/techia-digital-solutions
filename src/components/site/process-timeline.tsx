"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ProcessTimeline({ steps }: { steps: string[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {steps.map((step, index) => (
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={reduceMotion ? undefined : { duration: 0.45, delay: index * 0.08 }}
          className="gradient-border rounded-[1.5rem]"
        >
          <div className="elevated-panel h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-3xl font-semibold text-foreground">0{index + 1}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-accent-2 via-accent/40 to-transparent" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-foreground">{step}</h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
