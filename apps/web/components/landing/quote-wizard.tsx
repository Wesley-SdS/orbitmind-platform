"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { quoteRequestSchema } from "@orbitmind/shared";
import { cn } from "@/lib/utils";
import {
  ENGAGEMENT_OPTIONS,
  MONTHLY_BUDGET_OPTIONS,
  PROJECT_BUDGET_OPTIONS,
  QUOTE_EVENT,
  SOLUTION_OPTIONS,
  TIMELINE_OPTIONS,
  type QuoteBudget,
  type QuoteEngagement,
  type QuoteSolutionType,
  type QuoteTimeline,
} from "./data";
import { landingButton } from "./primitives";
import { EASE_OUT } from "./reveal";

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: "Como você quer trabalhar com a gente?",
  2: "O que vamos construir?",
  3: "Prazo e investimento",
  4: "Como falamos com você?",
};

interface ContactFields {
  name: string;
  email: string;
  company: string;
  phone: string;
  description: string;
}

type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const EMPTY_CONTACT: ContactFields = { name: "", email: "", company: "", phone: "", description: "" };

const FIELD_MESSAGES: Record<keyof ContactFields, string> = {
  name: "Informe seu nome.",
  email: "Informe um e-mail válido.",
  company: "Nome da empresa muito longo.",
  phone: "Telefone muito longo.",
  description: "Conte um pouco mais sobre o projeto (mínimo de 10 caracteres).",
};

const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: 24 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -24 * direction }),
};

function budgetOptionsFor(engagement: QuoteEngagement | null) {
  return engagement === "continuous" ? MONTHLY_BUDGET_OPTIONS : PROJECT_BUDGET_OPTIONS;
}

function labelOf<T extends string>(options: { value: T; label: string }[], value: T | null): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

function ChoiceChip({
  selected,
  onClick,
  role,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  role: "radio" | "checkbox";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-om-accent focus-visible:ring-offset-2",
        selected
          ? "border-om-fg bg-om-fg text-om-paper"
          : "border-om-fg/14 bg-white text-om-body hover:border-om-fg/30",
      )}
    >
      {role === "checkbox" && selected && <Check className="size-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {optional && <span className="font-normal text-om-fg-3"> · opcional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-om-accent-ink">
          {error}
        </p>
      )}
    </div>
  );
}

const INPUT_CLASS =
  "h-[46px] rounded-xl border bg-om-card px-3.5 text-sm text-om-fg outline-none transition-colors placeholder:text-om-fg-3 focus:border-om-fg/40 focus:bg-white";

export function QuoteWizard() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [engagement, setEngagement] = useState<QuoteEngagement | null>(null);
  const [solutions, setSolutions] = useState<QuoteSolutionType[]>([]);
  const [timeline, setTimeline] = useState<QuoteTimeline | null>(null);
  const [budget, setBudget] = useState<QuoteBudget | null>(null);
  const [contact, setContact] = useState<ContactFields>(EMPTY_CONTACT);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocus = useRef(false);

  const selectEngagement = (value: QuoteEngagement) => {
    setEngagement(value);
    setBudget((current) =>
      current && budgetOptionsFor(value).some((option) => option.value === current) ? current : null,
    );
  };

  // CTAs da seção de serviços pré-selecionam o formato e avançam para o passo 2.
  useEffect(() => {
    const onPick = (event: Event) => {
      const value = (event as CustomEvent<QuoteEngagement>).detail;
      setEngagement(value);
      setBudget((current) =>
        current && budgetOptionsFor(value).some((option) => option.value === current) ? current : null,
      );
      setStatus((current) => (current === "done" ? "idle" : current));
      setDirection(1);
      setStep((current) => (current === 1 ? 2 : current));
    };
    window.addEventListener(QUOTE_EVENT, onPick);
    return () => window.removeEventListener(QUOTE_EVENT, onPick);
  }, []);

  useEffect(() => {
    if (status === "done") headingRef.current?.focus({ preventScroll: true });
  }, [status]);

  const canContinue =
    step === 1
      ? engagement !== null
      : step === 2
        ? solutions.length > 0
        : step === 3
          ? timeline !== null && budget !== null
          : status !== "submitting";

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setFormError(null);
    shouldFocus.current = true;
  };

  const toggleSolution = (value: QuoteSolutionType) => {
    setSolutions((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const updateContact = (key: keyof ContactFields, value: string) => {
    setContact((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async () => {
    const parsed = quoteRequestSchema.safeParse({
      engagement,
      solutionTypes: solutions,
      timeline,
      budget,
      name: contact.name,
      email: contact.email,
      company: contact.company || undefined,
      phone: contact.phone || undefined,
      description: contact.description,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const next: ContactErrors = {};
      for (const key of Object.keys(FIELD_MESSAGES) as (keyof ContactFields)[]) {
        if (fieldErrors[key]?.length) next[key] = FIELD_MESSAGES[key];
      }
      setErrors(next);
      if (Object.keys(next).length === 0) setFormError("Revise as etapas anteriores antes de enviar.");
      return;
    }

    setErrors({});
    setFormError(null);
    setStatus("submitting");
    try {
      const response = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website }),
      });
      if (response.status === 429) {
        setFormError("Muitos envios seguidos. Tente novamente em alguns minutos.");
        setStatus("idle");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("done");
    } catch {
      setFormError("Não foi possível enviar agora. Tente novamente em instantes.");
      setStatus("idle");
    }
  };

  const restart = () => {
    setStep(1);
    setDirection(-1);
    setEngagement(null);
    setSolutions([]);
    setTimeline(null);
    setBudget(null);
    setContact(EMPTY_CONTACT);
    setErrors({});
    setFormError(null);
    setStatus("idle");
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 4) {
      void submit();
      return;
    }
    if (canContinue) goTo((step + 1) as Step);
  };

  const budgetOptions = budgetOptionsFor(engagement);
  const firstName = contact.name.trim().split(" ")[0] ?? "";

  if (status === "done") {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center rounded-[28px] border border-om-line bg-white p-8 text-center shadow-[0_30px_80px_rgb(26_26_23/0.08)] md:min-h-[640px]">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="flex size-16 items-center justify-center rounded-full bg-om-accent"
        >
          <Check className="size-7 text-om-fg" strokeWidth={2.5} />
        </motion.span>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-6 text-[32px] font-semibold tracking-[-0.02em] outline-none"
        >
          Pedido recebido!
        </h3>
        <p role="status" className="mt-2.5 max-w-[380px] text-base leading-relaxed text-om-fg-2">
          {firstName ? `Obrigado, ${firstName}. ` : ""}Nossa equipe vai analisar e responder no seu
          e-mail para marcar a conversa.
        </p>
        <button
          type="button"
          onClick={restart}
          className={cn(landingButton({ variant: "ghost", size: "sm" }), "mt-7 font-medium")}
        >
          Enviar outro pedido
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex min-h-[560px] flex-col rounded-[28px] border border-om-line bg-white p-6 shadow-[0_30px_80px_rgb(26_26_23/0.08)] md:min-h-[640px] md:p-10"
    >
      <div className="flex items-center justify-between">
        <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
          Passo {step} de 4
        </p>
        <div aria-hidden="true" className="flex gap-1.5">
          {[1, 2, 3, 4].map((index) => (
            <span key={index} className="h-1 w-7 overflow-hidden rounded-full bg-om-fg/10 md:w-9">
              <motion.span
                className="block h-full rounded-full bg-om-accent"
                initial={false}
                animate={{ width: index <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              />
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: EASE_OUT }}
            onAnimationComplete={(definition) => {
              if (definition === "center" && shouldFocus.current) {
                shouldFocus.current = false;
                headingRef.current?.focus({ preventScroll: true });
              }
            }}
          >
            <h3
              ref={headingRef}
              id="om-quote-step-title"
              tabIndex={-1}
              className="mt-7 text-2xl font-semibold tracking-[-0.02em] outline-none md:text-[28px]"
            >
              {STEP_TITLES[step]}
            </h3>

            {step === 1 && (
              <div
                role="radiogroup"
                aria-labelledby="om-quote-step-title"
                className="mt-6 flex flex-col gap-2.5"
              >
                {ENGAGEMENT_OPTIONS.map((option) => {
                  const selected = engagement === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectEngagement(option.value)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border px-5 py-[18px] text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-om-accent",
                        selected
                          ? "border-[1.5px] border-om-fg bg-om-card"
                          : "border-om-fg/12 bg-white hover:border-om-fg/28",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                          selected ? "border-om-fg" : "border-om-fg/25",
                        )}
                      >
                        {selected && (
                          <motion.span
                            layoutId="om-quote-engagement-dot"
                            className="size-2.5 rounded-full bg-om-accent"
                          />
                        )}
                      </span>
                      <span>
                        <span className="block text-base font-semibold">{option.title}</span>
                        <span className="mt-0.5 block text-sm text-om-fg-2">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <>
                <p className="mt-2 text-sm text-om-fg-2">Escolha quantas opções quiser.</p>
                <div
                  role="group"
                  aria-labelledby="om-quote-step-title"
                  className="mt-6 flex flex-wrap gap-2.5"
                >
                  {SOLUTION_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      role="checkbox"
                      selected={solutions.includes(option.value)}
                      onClick={() => toggleSolution(option.value)}
                    >
                      {option.label}
                    </ChoiceChip>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p id="om-quote-timeline" className="mt-6 font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                  Para quando?
                </p>
                <div role="radiogroup" aria-labelledby="om-quote-timeline" className="mt-3 flex flex-wrap gap-2">
                  {TIMELINE_OPTIONS.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      role="radio"
                      selected={timeline === option.value}
                      onClick={() => setTimeline(option.value)}
                    >
                      {option.label}
                    </ChoiceChip>
                  ))}
                </div>
                <p id="om-quote-budget" className="mt-7 font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                  {engagement === "continuous" ? "Investimento mensal estimado" : "Investimento estimado"}
                </p>
                <div role="radiogroup" aria-labelledby="om-quote-budget" className="mt-3 flex flex-wrap gap-2">
                  {budgetOptions.map((option) => (
                    <ChoiceChip
                      key={option.value}
                      role="radio"
                      selected={budget === option.value}
                      onClick={() => setBudget(option.value)}
                    >
                      {option.label}
                    </ChoiceChip>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <p className="mt-2 text-[13px] text-om-fg-3">
                  {labelOf(ENGAGEMENT_OPTIONS.map((o) => ({ value: o.value, label: o.title })), engagement)}
                  {" · "}
                  {solutions.length} {solutions.length === 1 ? "solução" : "soluções"}
                  {" · "}
                  {labelOf(TIMELINE_OPTIONS, timeline)}
                  {" · "}
                  {labelOf(budgetOptions, budget)}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Field id="om-quote-name" label="Nome" error={errors.name}>
                    <input
                      id="om-quote-name"
                      name="name"
                      autoComplete="name"
                      value={contact.name}
                      onChange={(event) => updateContact("name", event.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "om-quote-name-error" : undefined}
                      placeholder="Seu nome"
                      className={cn(INPUT_CLASS, errors.name ? "border-om-accent" : "border-om-fg/14")}
                    />
                  </Field>
                  <Field id="om-quote-email" label="E-mail" error={errors.email}>
                    <input
                      id="om-quote-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={(event) => updateContact("email", event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "om-quote-email-error" : undefined}
                      placeholder="voce@empresa.com"
                      className={cn(INPUT_CLASS, errors.email ? "border-om-accent" : "border-om-fg/14")}
                    />
                  </Field>
                  <Field id="om-quote-company" label="Empresa" optional error={errors.company}>
                    <input
                      id="om-quote-company"
                      name="company"
                      autoComplete="organization"
                      value={contact.company}
                      onChange={(event) => updateContact("company", event.target.value)}
                      className={cn(INPUT_CLASS, "border-om-fg/14")}
                    />
                  </Field>
                  <Field id="om-quote-phone" label="WhatsApp" optional error={errors.phone}>
                    <input
                      id="om-quote-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={contact.phone}
                      onChange={(event) => updateContact("phone", event.target.value)}
                      className={cn(INPUT_CLASS, "border-om-fg/14")}
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field id="om-quote-description" label="Conte sobre o projeto" error={errors.description}>
                    <textarea
                      id="om-quote-description"
                      name="description"
                      rows={4}
                      value={contact.description}
                      onChange={(event) => updateContact("description", event.target.value)}
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={errors.description ? "om-quote-description-error" : undefined}
                      placeholder="Qual problema vamos resolver? Quem vai usar?"
                      className={cn(
                        INPUT_CLASS,
                        "h-auto resize-none py-3",
                        errors.description ? "border-om-accent" : "border-om-fg/14",
                      )}
                    />
                  </Field>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Honeypot: invisível para pessoas, preenchido por bots. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="om-quote-website">Website</label>
        <input
          id="om-quote-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {formError && (
        <p role="alert" className="mt-5 text-sm text-om-accent-ink">
          {formError}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-om-line pt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => goTo((step - 1) as Step)}
            className={cn(landingButton({ variant: "ghost", size: "md" }), "font-medium")}
          >
            Voltar
          </button>
        ) : (
          <span className="text-[13px] text-om-fg-3">Leva uns 2 minutos</span>
        )}
        <button
          type="submit"
          disabled={!canContinue}
          className={cn(
            landingButton({ size: "md" }),
            "disabled:pointer-events-none disabled:opacity-35",
          )}
        >
          {step === 4 ? (
            status === "submitting" ? (
              <>
                <Loader2 className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                Enviar pedido
                <ArrowRight />
              </>
            )
          ) : (
            <>
              Continuar
              <ArrowRight />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
