import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CASE_APP_FEATURES,
  CASE_APP_STACK,
  CASE_SHIFTS,
  CASE_WEB_FEATURES,
  CASE_WEB_STACK,
  CASE_WEEK,
  WEEKDAY_LABELS,
} from "./data";
import { CONTAINER, Eyebrow, SectionTitle, SerifAccent } from "./primitives";
import { Reveal } from "./reveal";

function FeatureList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("gap-x-5 gap-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-normal text-om-body">
          <Check className="mt-0.5 size-[15px] shrink-0 text-om-accent" strokeWidth={2.5} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function StackChips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex h-[26px] items-center rounded-full border border-om-fg/10 bg-white px-2.5 text-xs text-om-fg-2"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ScheduleMock() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-om-line bg-white p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Escala da semana</span>
        <span className="flex h-[26px] items-center rounded-full border border-om-fg/10 px-2.5 text-xs text-om-fg-2">
          UTI adulto
        </span>
      </div>
      <div className="mt-3.5 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((day) => (
          <span key={day} className="text-center font-om-mono text-[10px] text-om-fg-3">
            {day}
          </span>
        ))}
        {CASE_WEEK.map((slot, index) => (
          <span
            key={index}
            className={cn(
              "flex h-[30px] items-center justify-center rounded-md font-om-mono text-[10px]",
              slot === "D" && "border border-om-accent/35 bg-om-accent/14 text-om-accent-ink",
              slot === "N" && "bg-om-fg text-om-paper",
              slot === "" && "border border-dashed border-om-fg/14 bg-om-bg text-om-fg-4",
            )}
          >
            {slot === "D" ? "Dia" : slot === "N" ? "Noite" : "aberta"}
          </span>
        ))}
      </div>
      <div className="mt-3.5 flex gap-4 text-[11px] text-om-fg-3">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm border border-om-accent/35 bg-om-accent/14" />
          Diurno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-om-fg" />
          Noturno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm border border-dashed border-om-fg/30" />
          Vaga aberta
        </span>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto h-[470px] w-[232px] shrink-0 rounded-[36px] bg-om-fg p-3.5 shadow-[0_30px_60px_rgb(26_26_23/0.2)]"
    >
      <div className="flex h-full flex-col gap-2 rounded-[26px] bg-om-paper px-3 py-[18px]">
        <p className="text-[13px] font-semibold">Plantões perto de você</p>
        <p className="text-[11px] text-om-fg-3">3 vagas abertas hoje</p>
        {CASE_SHIFTS.map((shift) => (
          <div
            key={shift.title}
            className={cn(
              "rounded-xl bg-white p-2.5",
              shift.highlight ? "border-[1.5px] border-om-accent" : "border border-om-line",
            )}
          >
            <p className="flex justify-between text-[11.5px] font-semibold">
              {shift.title}
              <span className="font-om-mono text-[10px] font-normal text-om-fg-3">{shift.distance}</span>
            </p>
            <p className="mt-0.5 text-[10.5px] text-om-fg-2">{shift.time}</p>
          </div>
        ))}
        <span className="mt-auto flex h-[38px] items-center justify-center gap-1.5 rounded-full bg-om-accent text-xs font-semibold text-om-fg">
          <MapPin className="size-3.5" />
          Fazer check-in
        </span>
      </div>
    </div>
  );
}

export function CaseSection() {
  return (
    <section
      id="cases"
      className="scroll-mt-18 border-y border-om-fg/6 bg-om-band py-20 md:py-[120px]"
    >
      <div className={CONTAINER}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-20">
          <Reveal>
            <Eyebrow>Case de cliente · Healthtech</Eyebrow>
            <SectionTitle>
              Plantões médicos,
              <br />
              <SerifAccent accent>de ponta a ponta.</SerifAccent>
            </SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-[440px] text-[17px] leading-relaxed text-om-fg-2">
              Para uma healthtech que conecta médicos a plantões, construímos as duas pontas da
              operação: a plataforma de quem contrata e o app de quem dá o plantão.{" "}
              <span className="text-om-fg-3">Nome do cliente preservado.</span>
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:mt-16 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="flex h-full flex-col gap-6 rounded-3xl border border-om-line bg-om-card p-7 md:p-9">
              <div>
                <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                  Plataforma web · quem contrata
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] md:text-[26px]">
                  Gestão de escalas, vagas e pagamentos
                </h3>
              </div>
              <FeatureList items={CASE_WEB_FEATURES} className="grid sm:grid-cols-2" />
              <div className="mt-auto flex flex-col gap-4">
                <ScheduleMock />
                <StackChips items={CASE_WEB_STACK} />
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1} className="h-full">
            <article className="grid h-full gap-7 rounded-3xl border border-om-line bg-om-card p-7 sm:grid-cols-[minmax(0,1fr)_232px] md:p-9">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                    App iOS e Android · quem dá plantão
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] md:text-[26px]">
                    Vagas perto de você, check-in por GPS
                  </h3>
                </div>
                <FeatureList items={CASE_APP_FEATURES} className="flex flex-col" />
                <div className="sm:mt-auto">
                  <StackChips items={CASE_APP_STACK} />
                </div>
              </div>
              <PhoneMock />
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
