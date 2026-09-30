import { CaseSection } from "./case-section";
import { Hero } from "./hero";
import { LandingMotion } from "./landing-motion";
import { PlatformSection } from "./platform-section";
import { ProcessSection } from "./process-section";
import { QuoteSection } from "./quote-section";
import { ServicesSection } from "./services-section";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SolutionsSection } from "./solutions-section";
import { StackMarquee } from "./stack-marquee";

export function LandingPage() {
  return (
    <LandingMotion>
      <div className="om-landing min-h-screen bg-om-bg font-sans text-om-fg antialiased">
        <SiteHeader />
        <main>
          <Hero />
          <StackMarquee />
          <SolutionsSection />
          <CaseSection />
          <PlatformSection />
          <ServicesSection />
          <ProcessSection />
          <QuoteSection />
        </main>
        <SiteFooter />
      </div>
    </LandingMotion>
  );
}
