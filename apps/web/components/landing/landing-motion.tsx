"use client";

import { MotionConfig } from "framer-motion";

/** Respeita prefers-reduced-motion em todas as animações framer da landing. */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
