import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AnalysisEmptyPortfolio } from "@/components/analysis/AnalysisEmptyPortfolio";
import { AnalysisExecutiveOverview } from "@/components/analysis/AnalysisExecutiveOverview";
import { AnalysisIntelligenceGrid } from "@/components/analysis/AnalysisIntelligenceGrid";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getAnalysisIntelligence } from "@/lib/analysis-intelligence";

export const metadata = { title: "Analisi" };

export default async function AnalysisPage() {
  const intelligence = await getAnalysisIntelligence();

  return (
    <PageShell>
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

      {intelligence.hasPortfolio ? (
        <AnalysisIntelligenceGrid intelligence={intelligence} />
      ) : (
        <AnalysisEmptyPortfolio />
      )}
    </PageShell>
  );
}
