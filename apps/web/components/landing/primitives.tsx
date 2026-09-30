import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const CONTAINER = "mx-auto w-full max-w-[1360px] px-6 md:px-10";

export const landingButton = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold outline-none transition-[transform,box-shadow,background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-om-accent focus-visible:ring-offset-2 focus-visible:ring-offset-om-bg [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-om-fg text-om-paper hover:-translate-y-px hover:shadow-[0_12px_28px_rgb(26_26_23/0.18)]",
        ghost:
          "border border-om-fg/14 bg-white/50 text-om-fg hover:border-om-fg/28 hover:bg-white/80",
      },
      size: {
        sm: "h-11 px-5 text-sm [&>svg]:size-4",
        md: "h-12 px-6 text-[15px] [&>svg]:size-4",
        lg: "h-14 px-7 text-base [&>svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-om-mono text-xs uppercase tracking-[0.14em] text-om-accent-ink",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mt-5 text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[56px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Palavra de ênfase em serifa itálica. `accent` pinta com a cor de destaque (só em texto grande). */
export function SerifAccent({
  children,
  accent = false,
  className,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <em
      className={cn(
        "font-om-serif font-normal italic tracking-[-0.01em]",
        accent && "text-om-accent",
        className,
      )}
    >
      {children}
    </em>
  );
}

export function AgentAvatar({
  initials,
  active = false,
  className,
}: {
  initials: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[30px] shrink-0 items-center justify-center rounded-full border bg-white text-[11px] font-semibold text-om-fg",
        active
          ? "border-[1.5px] border-om-accent shadow-[0_0_0_5px_rgb(242_84_27/0.10)]"
          : "border-om-fg/12",
        className,
      )}
    >
      {initials}
    </span>
  );
}
