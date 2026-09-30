"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-om-fg/14 bg-white px-4 text-[15px] text-om-fg outline-none transition-colors placeholder:text-om-fg-3 focus:border-om-fg/40 focus-visible:ring-2 focus-visible:ring-om-accent/30";

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function AuthField({ id, label, className, ...props }: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-om-fg">
        {label}
      </label>
      <input id={id} className={cn(INPUT_CLASS, className)} {...props} />
    </div>
  );
}

export function PasswordField({ id, label, className, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-om-fg">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(INPUT_CLASS, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-om-fg-3 transition-colors hover:text-om-fg"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    </div>
  );
}

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-om-fg-3">
      <span className="h-px flex-1 bg-om-line" />
      {children}
      <span className="h-px flex-1 bg-om-line" />
    </div>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-om-accent/30 bg-om-accent/8 px-3.5 py-2.5 text-sm text-om-accent-ink"
    >
      {children}
    </p>
  );
}
