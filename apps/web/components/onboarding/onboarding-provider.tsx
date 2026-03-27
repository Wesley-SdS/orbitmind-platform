"use client";

import { useEffect } from "react";
import { Onborda, OnbordaProvider as OnbordaCtx, useOnborda } from "onborda";
import { TourCard } from "./tour-card";
import { mainTourSteps } from "@/lib/onboarding/tour-steps";

interface OnboardingProviderProps {
  children: React.ReactNode;
  showTour?: boolean;
}

function TourTrigger({ showTour }: { showTour: boolean }) {
  const { startOnborda, isOnbordaVisible } = useOnborda();

  useEffect(() => {
    if (!showTour || isOnbordaVisible) return;
    const timer = setTimeout(() => startOnborda("main-onboarding"), 1000);
    return () => clearTimeout(timer);
  }, [showTour, startOnborda, isOnbordaVisible]);

  return null;
}

export function OnboardingProvider({ children, showTour = false }: OnboardingProviderProps) {
  return (
    <OnbordaCtx>
      <TourTrigger showTour={showTour} />
      <Onborda
        steps={mainTourSteps}
        shadowRgb="83,74,183"
        shadowOpacity="0.6"
        cardComponent={TourCard}
        cardTransition={{ duration: 0.3, type: "tween" }}
      >
        {children}
      </Onborda>
    </OnbordaCtx>
  );
}
