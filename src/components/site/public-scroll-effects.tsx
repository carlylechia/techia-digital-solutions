"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function PublicScrollEffects() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const progressScale = reduceMotion ? 0 : scrollYProgress;
  const cyanY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const roseY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.42, 0.34, 0.24, 0.18]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
        style={{ scaleX: progressScale }}
      />
      <motion.div
        className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl"
        style={{ y: reduceMotion ? 0 : cyanY, opacity: glowOpacity }}
      />
      <motion.div
        className="absolute right-[-4rem] top-[34vh] h-80 w-80 rounded-full bg-fuchsia-400/10 blur-3xl"
        style={{ y: reduceMotion ? 0 : roseY, opacity: glowOpacity }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_58%)]" />
    </div>
  );
}
