"use client";

import { X } from "lucide-react";
import { useOnborda } from "onborda";
import { Button } from "@/components/ui/button";
import type { CardComponentProps } from "onborda";

export function TourCard({ step, currentStep, totalSteps, nextStep, prevStep, arrow }: CardComponentProps) {
  const { closeOnborda } = useOnborda();
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  async function handleFinish() {
    sessionStorage.setItem("orbitmind-tour-done", "1");
    closeOnborda();
    try {
      await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } catch { /* */ }
  }

  return (
    <div className="relative w-80 rounded-xl border border-border bg-background shadow-xl">
      {/* Progress bar */}
      <div className="h-1 rounded-t-xl bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Close */}
      <button onClick={handleFinish} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{step.icon}</span>
          <h3 className="text-sm font-medium">{step.title}</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">{currentStep + 1}/{totalSteps}</span>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">{step.content}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        {isFirst ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleFinish}>Pular tour</Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs" onClick={prevStep}>Anterior</Button>
        )}
        {isLast ? (
          <Button size="sm" className="text-xs" onClick={handleFinish}>Concluir</Button>
        ) : (
          <Button size="sm" className="text-xs" onClick={nextStep}>Proximo</Button>
        )}
      </div>

      {/* Arrow */}
      {arrow}
    </div>
  );
}
