import { ClipboardCheck, Shield, Sparkles, Target } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import type { RecommendationsExecutiveOverview as ExecutiveData } from "@/lib/recommendations-intelligence";

interface RecommendationsExecutiveOverviewProps {
  executive: ExecutiveData;
  readinessLabel: string;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/D";
  }
  return `${value}%`;
}

export function RecommendationsExecutiveOverview({
  executive,
  readinessLabel,
}: RecommendationsExecutiveOverviewProps) {
  return (
    <div className="atlas-grid-kpi grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Azioni consigliate"
        value={String(executive.totalRecommendations)}
        subtext={
          executive.totalRecommendations > 0
            ? `${executive.highPriorityCount} prioritarie`
            : "Nessuna azione pendente"
        }
        variant={executive.highPriorityCount > 0 ? "yellow" : "green"}
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        label="Criticità"
        value={String(executive.criticalItemsCount)}
        subtext={
          executive.criticalItemsCount > 0
            ? "Richiedono attenzione immediata"
            : "Nessuna criticità alta"
        }
        variant={executive.criticalItemsCount > 0 ? "red" : "green"}
        icon={<Shield className="h-4 w-4" />}
      />
      <MetricCard
        label="Polizze confermate"
        value={formatPercent(executive.confirmedPoliciesPercent)}
        subtext={
          executive.pendingReviewCount > 0
            ? `${executive.pendingReviewCount} in revisione`
            : "Portafoglio verificato"
        }
        unavailableValue={executive.confirmedPoliciesPercent === null}
        variant="indigo"
        icon={<ClipboardCheck className="h-4 w-4" />}
      />
      <MetricCard
        label="Prontezza Atlas"
        value={formatPercent(executive.portfolioReadinessPercent)}
        subtext={readinessLabel}
        unavailableValue={executive.portfolioReadinessPercent === null}
        variant="purple"
        icon={<Sparkles className="h-4 w-4" />}
      />
    </div>
  );
}
