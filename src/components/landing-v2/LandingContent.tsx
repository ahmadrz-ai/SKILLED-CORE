"use client";

import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { ServiceShowcase } from "./ServiceShowcase";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingPricing } from "./LandingPricing";
import { LandingCTA } from "./LandingCTA";
import { LandingFooter } from "./LandingFooter";

export default function LandingContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff', color: '#1E1B4B' }}>
      <LandingNavbar />
      <main>
        <LandingHero />
        <ServiceShowcase />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
