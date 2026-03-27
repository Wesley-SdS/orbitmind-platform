"use client";

import { cn } from "@/lib/utils";

interface PageLoaderProps {
  text?: string;
  className?: string;
}

interface SectionLoaderProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Full-page loading state with animated OrbitMind branding.
 * Used in Next.js loading.tsx files for route-level suspense boundaries.
 */
export function PageLoader({ text, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-6 animate-in fade-in duration-500",
        className
      )}
    >
      <OrbitAnimation size={64} />
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700">
          {text}
        </p>
      )}
      <ShimmerBar />
    </div>
  );
}

/**
 * Inline section loader for smaller areas within a page.
 */
export function SectionLoader({
  text,
  className,
  size = "md",
}: SectionLoaderProps) {
  const orbitSize = size === "sm" ? 32 : size === "md" ? 44 : 56;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 animate-in fade-in duration-500",
        className
      )}
    >
      <OrbitAnimation size={orbitSize} />
      {text && (
        <p className="text-xs font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

/** Orbiting dots animation -- space/orbit themed. */
function OrbitAnimation({ size }: { size: number }) {
  const dotSize = Math.max(4, Math.round(size / 10));
  const orbitRadius = (size - dotSize) / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Central pulsing core */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: dotSize * 2.5,
          height: dotSize * 2.5,
          marginLeft: -(dotSize * 2.5) / 2,
          marginTop: -(dotSize * 2.5) / 2,
          background: "oklch(0.55 0.24 270)",
          animation: "om-pulse 2s ease-in-out infinite",
        }}
      />

      {/* Orbit ring (subtle) */}
      <div className="absolute inset-1 rounded-full border border-purple-500/20" />

      {/* Orbiting dots */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 0,
            height: 0,
            animation: "om-rotate 1.8s linear infinite",
            animationDelay: `${i * -0.6}s`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              marginLeft: -dotSize / 2,
              transform: `translateY(-${orbitRadius}px)`,
              background: `oklch(${0.6 + i * 0.1} 0.22 ${265 + i * 15})`,
              boxShadow: `0 0 ${dotSize * 2}px oklch(0.55 0.24 270 / 0.5)`,
              animation: "om-dot-fade 1.8s ease-in-out infinite",
              animationDelay: `${i * -0.6}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Animated gradient shimmer bar. */
function ShimmerBar() {
  return (
    <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.55 0.24 270 / 0.6), oklch(0.6 0.2 290 / 0.4), transparent)",
          animation: "om-shimmer 1.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
