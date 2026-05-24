import { ClipboardCheck, FileText, Link2, Shield, Sparkles } from "lucide-react";
import { DashboardHealthScoreCard } from "@/components/dashboard/DashboardHealthScoreCard";
import { MetricCard } from "@/components/ui/MetricCard";
import type { AnalysisExecutiveOverview as ExecutiveData } from "@/lib/analysis-intelligence";
import { atlasKpiRowWide, atlasSpace } from "@/lib/atlas-ui";
import { formatCHF } from "@/lib/utils";

interface AnalysisExecutiveOverviewProps {
  executive: ExecutiveData;
}

function formatPercent(value: number | null, suffix = "%") {
  if (value === null) {
    return "N/D";
  }
  return `${value}${suffix}`;
}

export function AnalysisExecutiveOverview({ executive }: AnalysisExecutiveOverviewProps) {
  return (
    <div className={atlasSpace.block}>
      <DashboardHealthScoreCard healthScore={executive.healthScore} />

      <div className={atlasKpiRowWide}>
        <MetricCard
          label="Polizze analizzate"
          value={String(executive.policiesAnalyzed)}
          subtext={`${executive.policiesConfirmed} confermate`}
          variant="indigo"
          icon={<Shield className="h-4 w-4" />}
        />
        <MetricCard
          label="Completamento"
          value={formatPercent(executive.analysisCompletionPercent)}
          subtext="Analisi portafoglio"
          variant="blue"
          unavailableValue={executive.analysisCompletionPercent === null}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Da rivedere"
          value={String(executive.reviewPending)}
          subtext="Bozze in coda"
          variant={executive.reviewPending > 0 ? "yellow" : "green"}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="Confidenza media"
          value={formatPercent(executive.averageConfidence)}
          subtext="Estrazione AI"
          variant="purple"
          unavailableValue={executive.averageConfidence === null}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Pipeline documenti"
          value={formatPercent(executive.documentProcessingPercent)}
          subtext="PDF analizzati"
          variant="green"
          unavailableValue={executive.documentProcessingPercent === null}
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricCard
          label="PDF collegati"
          value={formatPercent(executive.linkedDocumentPercent)}
          subtext={
            executive.unresolvedWarnings > 0
              ? `${executive.unresolvedWarnings} avvisi estrazione`
              : "Polizze con origine"
          }
          variant="blue"
          unavailableValue={executive.linkedDocumentPercent === null}
          icon={<Link2 className="h-4 w-4" />}
        />
      </div>

      {executive.annualPremiumTotal !== null ? (
        <div className="atlas-card-secondary flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-[11px] text-muted">
            Premio annuo stimato (polizze confermate)
          </p>
          <p className="text-[14px] font-semibold tabular-nums text-foreground">
            {formatCHF(executive.annualPremiumTotal)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
