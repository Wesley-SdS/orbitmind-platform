"use client";

import { useState, useEffect } from "react";
import { Onborda, OnbordaProvider as OnbordaCtx } from "onborda";
import { TourCard } from "./tour-card";
import { mainTourSteps } from "@/lib/onboarding/tour-steps";

interface OnboardingProviderProps {
  children: React.ReactNode;
  showTour?: boolean;
}

export function OnboardingProvider({ children, showTour = false }: OnboardingProviderProps) {
  const [show, setShow] = useState(false);

  // Small delay to let the page render first
  useEffect(() => {
    if (showTour) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showTour]);

  return (
    <OnbordaCtx>
      <Onborda
        steps={mainTourSteps}
        showOnborda={show}
        shadowRgb="83,74,183"
        shadowOpacity="0.6"
        cardComponent={TourCard as any}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        {children}
      </Onborda>
    </OnbordaCtx>
  );
}
