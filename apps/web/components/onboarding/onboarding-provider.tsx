"use client";

import { useEffect, useState } from "react";
import { Onborda, OnbordaProvider as OnbordaCtx, useOnborda } from "onborda";
import { TourCard } from "./tour-card";
import { mainTourSteps } from "@/lib/onboarding/tour-steps";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

let tourStarted = false;

function TourTrigger({ showTour }: { showTour: boolean }) {
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (!showTour || tourStarted) return;
    tourStarted = true;
    const timer = setTimeout(() => startOnborda("main-onboarding"), 1000);
    return () => clearTimeout(timer);
  }, [showTour, startOnborda]);

  return null;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.ok ? r.json() : null)
      .then((org) => {
        if (org && !org.onboardingCompleted) setShowTour(true);
      })
      .catch(() => {});
  }, []);

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
