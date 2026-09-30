"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_CASES, type AgentStatus, type DemoCase } from "./data";
import { OrbitMark } from "./orbit-mark";
import { AgentAvatar } from "./primitives";
import { EASE_OUT } from "./reveal";

const TYPE_SPEED_MS = 28;
const AUTO_ADVANCE_MS = 7000;

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.3, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

type StepState = "done" | "active" | "gate" | "todo";

function stepState(demo: DemoCase, index: number, ready: boolean): StepState {
  if (ready && index < demo.current) return "done";
  if (ready && index === demo.current) return "active";
  if (index === demo.gate) return "gate";
  return "todo";
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-om-accent">
        <Check className="size-3 text-om-fg" strokeWidth={3.5} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border-2 border-om-accent bg-om-card shadow-[0_0_0_5px_rgb(242_84_27/0.10)]">
        <span className="size-2 animate-oml-pulse rounded-full bg-om-accent" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "size-6 rounded-full border-[1.5px] bg-om-card transition-colors",
        state === "gate" ? "border-dashed border-om-fg" : "border-om-fg/18",
      )}
    />
  );
}

function StatusBadge({ status }: { status: AgentStatus }) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1.5 font-om-mono text-[11px] text-om-fg-2">
        <Check className="size-3.5 text-om-accent" strokeWidth={2.5} />
        feito
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex items-center gap-1.5 font-om-mono text-[11px] font-medium text-om-accent-ink">
        <span className="size-1.5 animate-oml-pulse rounded-full bg-om-accent" />
        ativo
      </span>
    );
  }
  return <span className="font-om-mono text-[11px] text-om-fg-3">na fila</span>;
}

function PipelineTrack({ demo, ready }: { demo: DemoCase; ready: boolean }) {
  const total = demo.steps.length;
  const inset = `${50 / total}%`;

  return (
    <div>
      <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">Pipeline</p>
      <div className="relative mt-4 flex">
        <div className="absolute top-[11px] h-0.5 bg-om-fg/10" style={{ left: inset, right: inset }} />
        <motion.div
          className="absolute top-[11px] h-0.5 bg-om-accent"
          style={{ left: inset }}
          initial={false}
          animate={{ width: ready ? `${(demo.current / total) * 100}%` : "0%" }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
        {demo.steps.map((label, index) => {
          const state = stepState(demo, index, ready);
          return (
            <div
              key={`${demo.id}-${label}`}
              className="relative flex flex-1 flex-col items-center gap-2.5"
            >
              <StepDot state={state} />
              <span
                className={cn(
                  "hidden whitespace-nowrap text-xs sm:block",
                  state === "active" && "font-semibold text-om-fg",
                  state === "done" && "text-om-fg-2",
                  (state === "gate" || state === "todo") && "text-om-fg-3",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-om-fg-2 sm:hidden">
        Etapa {demo.current + 1} de {total}:{" "}
        <span className="font-semibold text-om-fg">{demo.steps[demo.current] ?? ""}</span>
      </p>
    </div>
  );
}

export function SquadDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);

  const demo = DEMO_CASES[index] ?? DEMO_CASES[0];
  const visibleChars = reduce ? demo.prompt.length : typed;
  const ready = visibleChars >= demo.prompt.length;
  const typing = inView && !ready;

  useEffect(() => {
    if (!inView || reduce || typed >= demo.prompt.length) return;
    const timer = setTimeout(() => setTyped((count) => count + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [inView, reduce, typed, demo.prompt.length]);

  useEffect(() => {
    if (!autoplay || paused || reduce || !ready || !inView) return;
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % DEMO_CASES.length);
      setTyped(0);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [autoplay, paused, reduce, ready, inView]);

  const select = (next: number) => {
    setAutoplay(false);
    if (next === index) return;
    setIndex(next);
    setTyped(0);
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + DEMO_CASES.length) % DEMO_CASES.length;
    select(next);
    document.getElementById(`om-demo-tab-${DEMO_CASES[next]?.id}`)?.focus();
  };

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        role="tablist"
        aria-label="Cenários de exemplo"
        className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        {DEMO_CASES.map((item, itemIndex) => {
          const selected = itemIndex === index;
          return (
            <button
              key={item.id}
              id={`om-demo-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="om-demo-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(itemIndex)}
              onKeyDown={onTabKeyDown}
              className={cn(
                "relative h-11 shrink-0 whitespace-nowrap rounded-full border px-5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-om-accent",
                selected
                  ? "border-om-fg font-semibold text-om-paper"
                  : "border-om-fg/12 font-medium text-om-fg-2 hover:border-om-fg/28 hover:text-om-fg",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="om-demo-tab-pill"
                  className="absolute inset-0 rounded-full bg-om-fg"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id="om-demo-panel"
        role="tabpanel"
        aria-labelledby={`om-demo-tab-${demo.id}`}
        className="mt-6 grid overflow-hidden rounded-3xl border border-om-line bg-om-card shadow-[0_30px_80px_rgb(26_26_23/0.06)] lg:h-[540px] lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]"
      >
        {/* Chat com o Architect */}
        <div className="flex min-h-0 flex-col border-b border-om-line lg:border-b-0 lg:border-r">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-om-line px-6">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-om-fg">
              <OrbitMark tone="light" className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Architect</p>
              <p className="mt-0.5 text-xs text-om-fg-3">Monta squads a partir de uma conversa</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-om-fg-2">
              <span className="size-1.5 rounded-full bg-om-accent" />
              online
            </span>
          </div>

          <div className="flex min-h-[380px] flex-1 flex-col gap-3.5 overflow-hidden px-6 py-5 lg:min-h-0">
            <p className="sr-only">{demo.prompt}</p>
            <div
              aria-hidden="true"
              className="max-w-[400px] self-end rounded-[18px_18px_4px_18px] bg-om-fg px-4 py-3 text-[15px] leading-normal text-om-paper"
            >
              {demo.prompt.slice(0, visibleChars)}
              {typing && (
                <span className="ml-0.5 inline-block h-[17px] w-0.5 animate-oml-blink bg-om-paper align-[-3px]" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {ready && (
                <motion.div
                  key={demo.id}
                  className="flex flex-col gap-3.5"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <motion.p
                    variants={itemVariants}
                    className="flex items-center gap-2 self-center rounded-full border border-om-line bg-white px-3 py-1.5 text-center font-om-mono text-[11.5px] text-om-fg-2"
                  >
                    <Check className="size-3.5 shrink-0 text-om-accent" strokeWidth={2.5} />
                    Squad criado · {demo.squad} · {demo.meta}
                  </motion.p>
                  {demo.messages.map((message) => (
                    <motion.div
                      key={message.text}
                      variants={itemVariants}
                      className="flex items-start gap-2.5"
                    >
                      <AgentAvatar initials={message.initials} />
                      <div className="max-w-[440px]">
                        <p className="mb-1 text-xs text-om-fg-3">{message.name}</p>
                        <p className="rounded-[4px_16px_16px_16px] bg-om-muted px-3.5 py-2.5 text-sm leading-normal">
                          {message.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form
            action="/register"
            className="flex h-[76px] shrink-0 items-center border-t border-om-line px-6"
          >
            <label htmlFor="om-demo-prompt" className="sr-only">
              Descreva o que você precisa
            </label>
            <div className="flex h-[52px] flex-1 items-center gap-2 rounded-full border border-om-fg/10 bg-white pl-5 pr-1.5 transition-colors focus-within:border-om-fg/30">
              <input
                id="om-demo-prompt"
                name="q"
                type="text"
                placeholder="Descreva o que você precisa…"
                className="min-w-0 flex-1 bg-transparent text-sm text-om-fg outline-none placeholder:text-om-fg-3"
              />
              <button
                type="submit"
                aria-label="Começar com esse pedido"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-om-fg text-om-paper transition-transform hover:scale-105"
              >
                <ArrowUp className="size-4" strokeWidth={2.2} />
              </button>
            </div>
          </form>
        </div>

        {/* Squad montado */}
        <div className="flex min-w-0 flex-col gap-7 p-6 md:px-8 md:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                Squad
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">{demo.squad}</p>
                  <p className="mt-1 text-[13px] text-om-fg-2">{demo.meta}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <span className="flex h-[30px] shrink-0 items-center gap-2 rounded-full border border-om-accent/35 bg-om-accent/10 px-3 text-xs font-medium text-om-accent-ink">
              <span className="size-1.5 animate-oml-pulse rounded-full bg-om-accent" />
              {ready ? "Em execução" : "Montando…"}
            </span>
          </div>

          <PipelineTrack demo={demo} ready={ready} />

          <div>
            <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
              Agentes
            </p>
            {ready ? (
              <motion.ul
                key={demo.id}
                className="mt-3 grid gap-2 sm:grid-cols-2"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                initial="hidden"
                animate="show"
              >
                {demo.agents.map((agent) => (
                  <motion.li
                    key={agent.name}
                    variants={itemVariants}
                    className={cn(
                      "flex h-[52px] items-center gap-2.5 rounded-xl border bg-om-bg px-3",
                      agent.status === "active" ? "border-om-accent/35" : "border-om-fg/6",
                    )}
                  >
                    <AgentAvatar initials={agent.initials} active={agent.status === "active"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{agent.name}</p>
                      <p className="text-xs text-om-fg-3">{agent.role}</p>
                    </div>
                    <StatusBadge status={agent.status} />
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <p className="mt-3 flex h-[52px] items-center gap-2 rounded-xl border border-dashed border-om-fg/14 px-4 text-sm text-om-fg-3">
                <span className="size-1.5 animate-oml-pulse rounded-full bg-om-accent" />
                O Architect está montando o time…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
