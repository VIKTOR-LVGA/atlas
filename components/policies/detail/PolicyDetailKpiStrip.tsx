import { ClipboardCheck, Layers3, Shield, Sparkles, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCHF } from "@/lib/utils";
import type { PolicyPremiumFrequency } from "@/lib/types";

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

interface PolicyDetailKpiStripProps {
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  insuredCount: number;
  coverageCount: number;
  extractionConfidence: number | null;
  requiresReview: boolean;
  completenessPercent: number | null;
}

export function PolicyDetailKpiStrip({
  premiumAmount,
  premiumFrequency,
  insuredCount,
  coverageCount,
  extractionConfidence,
  requiresReview,
  completenessPercent,
}: PolicyDetailKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
      <MetricCard
        label="Premio contratto"
        value={premiumAmount === null ? "N/D" : formatCHF(premiumAmount)}
        subtext={premiumFrequencyLabels[premiumFrequency]}
        unavailableValue={premiumAmount === null}
        variant="blue"
        icon={<Shield className="h-4 w-4" />}
      />
      <MetricCard
        label="Persone"
        value={insuredCount > 0 ? String(insuredCount) : "N/D"}
        subtext={
          insuredCount > 0
            ? insuredCount === 1
              ? "assicurata"
              : "assicurate"
            : "Non disponibile"
        }
        unavailableValue={insuredCount === 0}
        variant="green"
        icon={<Users className="h-4 w-4" />}
      />
      <MetricCard
        label="Coperture"
        value={coverageCount > 0 ? String(coverageCount) : "N/D"}
        subtext="raggruppate nel documento"
        unavailableValue={coverageCount === 0}
        variant="purple"
        icon={<Layers3 className="h-4 w-4" />}
      />
      <MetricCard
        label="Confidenza AI"
        value={
          extractionConfidence === null ? "N/D" : `${extractionConfidence}%`
        }
        subtext={
          extractionConfidence !== null && extractionConfidence < 75
            ? "Verifica consigliata"
            : "Estrazione documento"
        }
        unavailableValue={extractionConfidence === null}
        variant="indigo"
        icon={<Sparkles className="h-4 w-4" />}
      />
      <MetricCard
        label="Revisione"
        value={requiresReview ? "Da fare" : "Ok"}
        subtext={
          completenessPercent !== null
            ? `Completezza ${completenessPercent}%`
            : "In preparazione"
        }
        variant={requiresReview ? "yellow" : "green"}
        icon={<ClipboardCheck className="h-4 w-4" />}
        className="col-span-2 lg:col-span-1"
      />
    </div>
  );
}
