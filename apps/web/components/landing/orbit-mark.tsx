import { cn } from "@/lib/utils";

interface OrbitMarkProps {
  className?: string;
  /** `dark` para fundos claros, `light` para fundos escuros. */
  tone?: "dark" | "light";
}

export function OrbitMark({ className, tone = "dark" }: OrbitMarkProps) {
  const stroke = tone === "dark" ? "#1a1a17" : "#f7f5f0";

  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <circle cx="14" cy="14" r="4" className="fill-om-accent" />
      <ellipse
        cx="14"
        cy="14"
        rx="12"
        ry="5.5"
        transform="rotate(-28 14 14)"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="24.6" cy="8.4" r="2" fill={stroke} />
    </svg>
  );
}
