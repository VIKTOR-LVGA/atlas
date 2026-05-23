import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProductShowcase } from "@/components/landing/LandingProductShowcase";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingMarketComparison } from "@/components/landing/LandingMarketComparison";
import { LandingTrust } from "@/components/landing/LandingTrust";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";

export default function HomePage() {
  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="overflow-x-hidden">
        <LandingHero />
        <LandingProductShowcase />
        <LandingHowItWorks />
        <LandingMarketComparison />
        <LandingTrust />
        <LandingFaq />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
