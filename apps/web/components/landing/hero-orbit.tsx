"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { ORBIT_RINGS, ORBIT_SIZE, type OrbitNodeData } from "./data";
import { OrbitMark } from "./orbit-mark";
import { EASE_OUT } from "./reveal";

function OrbitNode({ node, showLabel }: { node: OrbitNodeData; showLabel: boolean }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "flex size-[34px] items-center justify-center rounded-full bg-white text-[11px] font-bold md:size-11 md:text-[13px]",
          node.active
            ? "border-[1.5px] border-om-accent shadow-[0_0_0_6px_rgb(242_84_27/0.10),0_10px_30px_rgb(242_84_27/0.35)]"
            : "border border-om-fg/12 shadow-[0_6px_16px_rgb(26_26_23/0.06)]",
        )}
        style={{ color: node.color }}
      >
        {node.mono}
      </div>
      <div
        className={cn(
          "absolute left-1/2 top-[calc(100%+8px)] hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs",
          showLabel && "md:flex",
          node.active
            ? "border-om-accent/35 bg-white text-om-fg"
            : "border-om-line bg-white/90 text-om-fg-2",
        )}
      >
        {node.active && <span className="size-1.5 rounded-full bg-om-accent" />}
        {node.label}
      </div>
    </div>
  );
}

function OrbitRings({ showLabels }: { showLabels: boolean }) {
  return (
    <>
      {ORBIT_RINGS.map((ring) => {
        const diameter = `${((ring.radius * 2) / ORBIT_SIZE) * 100}%`;
        const offset = `${50 - (ring.radius / ORBIT_SIZE) * 100}%`;
        const spin = ring.reverse ? "oml-spin-rev" : "oml-spin";
        const counter = ring.reverse ? "oml-spin" : "oml-spin-rev";

        return (
          <div
            key={ring.radius}
            className={cn(
              "absolute rounded-full border",
              ring.dashed ? "border-dashed border-om-fg/16" : "border-om-fg/10",
            )}
            style={{
              width: diameter,
              height: diameter,
              left: offset,
              top: offset,
              animation: `${spin} ${ring.duration}s linear infinite`,
            }}
          >
            {ring.nodes.map((node) => (
              <div
                key={node.mono}
                className="absolute inset-0"
                style={{ transform: `rotate(${node.angle}deg)` }}
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div style={{ transform: `rotate(${-node.angle}deg)` }}>
                    <div style={{ animation: `${counter} ${ring.duration}s linear infinite` }}>
                      <OrbitNode node={node} showLabel={showLabels} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function ProjectCard() {
  return (
    <div className="animate-oml-float rounded-[18px] border border-om-line bg-white/90 px-[18px] py-4 shadow-[0_24px_60px_rgb(26_26_23/0.12)] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-om-mono text-[11px] uppercase tracking-[0.12em] text-om-accent-ink">
          <span className="size-1.5 animate-oml-pulse rounded-full bg-om-accent" />
          Novo projeto
        </span>
        <span className="font-om-mono text-[11px] text-om-fg-3">Proposta</span>
      </div>
      <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.01em]">App + agentes de IA</p>
      <p className="mt-1 text-[13px] leading-snug text-om-fg-2">
        Discovery concluído · escopo e prazo em revisão
      </p>
      <div className="mt-3.5 flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <motion.span
            key={index}
            className="h-1 flex-1 rounded-full bg-om-fg/10"
            initial={false}
            animate={{ backgroundColor: index < 2 ? "#f2541b" : "rgba(26,26,23,0.10)" }}
            transition={{ delay: 1 + index * 0.25, duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewCard() {
  return (
    <div
      className="rounded-2xl border border-om-line bg-white/90 px-4 py-3.5 shadow-[0_24px_60px_rgb(26_26_23/0.12)] backdrop-blur-md"
      style={{ animation: "oml-float 8s ease-in-out -3s infinite" }}
    >
      <p className="font-om-mono text-[11px] uppercase tracking-[0.12em]">Sprint review</p>
      <p className="mt-2 text-sm leading-snug">Demo das entregas da semana com o cliente</p>
      <div className="mt-3 flex gap-2 text-[12.5px]">
        <span className="flex h-8 items-center rounded-full border border-om-fg/14 px-3.5 text-om-fg-2">
          Comentar
        </span>
        <span className="flex h-8 items-center rounded-full bg-om-accent px-3.5 font-semibold text-om-fg">
          Aprovar
        </span>
      </div>
    </div>
  );
}

/** Núcleo OrbitMind com os anéis de produtos. Reutilizado no hero e nas telas de login. */
export function OrbitSystem({
  showLabels = true,
  className,
}: {
  showLabels?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {/* Núcleo antes dos anéis: os rótulos dos produtos passam por cima dele. */}
      <div className="absolute left-1/2 top-1/2 flex size-[21.4%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-full bg-om-fg shadow-[0_0_0_14px_rgb(242_84_27/0.10),0_30px_70px_rgb(26_26_23/0.25),0_0_120px_rgb(242_84_27/0.35)]">
        <OrbitMark tone="light" className="size-8 md:size-10" />
        {showLabels && (
          <span className="hidden font-om-mono text-[10.5px] uppercase tracking-[0.16em] text-om-paper/70 md:block">
            OrbitMind
          </span>
        )}
      </div>
      <OrbitRings showLabels={showLabels} />
    </div>
  );
}

/** Ecossistema OrbitMind: produtos e cases orbitando a empresa, com parallax no ponteiro. */
export function HeroOrbit() {
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 50, damping: 18 });
  const springY = useSpring(pointerY, { stiffness: 50, damping: 18 });
  const orbitX = useTransform(springX, (v) => v * 16);
  const orbitY = useTransform(springY, (v) => v * 16);
  const cardX = useTransform(springX, (v) => v * -28);
  const cardY = useTransform(springY, (v) => v * -28);

  useEffect(() => {
    if (reduce) return;
    const onMove = (event: PointerEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, pointerX, pointerY]);

  return (
    <motion.div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-[600px]"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: EASE_OUT }}
    >
      <motion.div style={{ x: orbitX, y: orbitY }}>
        <OrbitSystem />
      </motion.div>

      <motion.div
        className="relative mt-6 lg:absolute lg:-left-16 lg:bottom-4 lg:mt-0 lg:w-[290px]"
        style={{ x: cardX, y: cardY }}
      >
        <ProjectCard />
      </motion.div>

      <motion.div
        className="absolute -right-2 -top-1 hidden w-[230px] lg:block"
        style={{ x: cardX, y: cardY }}
      >
        <ReviewCard />
      </motion.div>
    </motion.div>
  );
}
