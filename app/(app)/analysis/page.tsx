import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AnalysisEmptyPortfolio } from "@/components/analysis/AnalysisEmptyPortfolio";
import { AnalysisExecutiveOverview } from "@/components/analysis/AnalysisExecutiveOverview";
import { AnalysisIntelligenceGrid } from "@/components/analysis/AnalysisIntelligenceGrid";
import { AnalysisUnlockGuidance } from "@/components/onboarding/AnalysisUnlockGuidance";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { getAnalysisIntelligence } from "@/lib/analysis-intelligence";
import { getPortfolioProgression } from "@/lib/portfolio-progression";

export const metadata = { title: "Analisi" };

export default async function AnalysisPage() {
  const [intelligence, progression] = await Promise.all([
    getAnalysisIntelligence(),
    getPortfolioProgression(),
  ]);

  const analysisUnlocked = progression.unlocks.find(
    (module) => module.id === "analysis"
  )?.unlocked;

  return (
    <PageShell>
      <RevealStagger>
      <PageHeader
        title="Analisi"
        description="Centro intelligence Atlas: diagnostica del portafoglio basata su dati estratti e verificati."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/policies"
              className="atlas-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-[12px]"
            >
              Vedi polizze
            </Link>
            <PrimaryButton href="/documents" icon={<Sparkles className="h-4 w-4" />}>
              Carica PDF
            </PrimaryButton>
          </div>
        }
      />

      <AnalysisExecutiveOverview executive={intelligence.executive} />

      {!intelligence.hasPortfolio ? (
        <AnalysisEmptyPortfolio progression={progression} />
      ) : analysisUnlocked ? (
        <AnalysisIntelligenceGrid intelligence={intelligence} />
      ) : (
        <AnalysisUnlockGuidance progression={progression} />
      )}
      </RevealStagger>
    </PageShell>
  );
}
