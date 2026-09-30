"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "./reveal";

interface CountUpProps {
  value: number;
  duration?: number;
}

/** Conta de 0 até `value` quando entra na viewport. SSR renderiza o valor final. */
export function CountUp({ value, duration = 1.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (reduce) return;
    setDisplay(0);
    setArmed(true);
  }, [reduce]);

  useEffect(() => {
    if (!armed || !inView) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [armed, inView, value, duration]);

  return <span ref={ref}>{display}</span>;
}
