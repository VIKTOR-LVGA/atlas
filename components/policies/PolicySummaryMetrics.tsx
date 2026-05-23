import { Layers3, Shield, Sparkles, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCHF } from "@/lib/utils";
import type { PolicyPremiumFrequency } from "@/lib/types";

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

interface PolicySummaryMetricsProps {
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  insuredCount: number;
  coverageCount: number;
  extractionConfidence: number | null;
}

export function PolicySummaryMetrics({
  premiumAmount,
  premiumFrequency,
  insuredCount,
  coverageCount,
  extractionConfidence,
}: PolicySummaryMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Premio"
        value={premiumAmount === null ? "—" : formatCHF(premiumAmount)}
        subtext={premiumFrequencyLabels[premiumFrequency]}
        variant="blue"
        icon={<Shield className="h-[18px] w-[18px]" />}
      />
      <MetricCard
        label="Persone"
        value={String(insuredCount)}
        subtext={insuredCount === 1 ? "assicurata" : "assicurate"}
        variant="green"
        icon={<Users className="h-[18px] w-[18px]" />}
      />
      <MetricCard
        label="Coperture"
        value={String(coverageCount)}
        subtext="nel documento"
        variant="purple"
        icon={<Layers3 className="h-[18px] w-[18px]" />}
      />
      <MetricCard
        label="Confidenza"
        value={
          extractionConfidence === null ? "—" : `${extractionConfidence}%`
        }
        subtext={
          extractionConfidence !== null && extractionConfidence < 75
            ? "Verifica consigliata"
            : "Estrazione AI"
        }
        variant="indigo"
        icon={<Sparkles className="h-[18px] w-[18px]" />}
      />
    </div>
  );
}
