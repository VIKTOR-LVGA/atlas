import { ClipboardCheck, Layers3, Shield, Sparkles, Users } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { cn, formatCHF } from "@/lib/utils";
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

function getKpiGridClass(count: number) {
  if (count <= 2) {
    return "grid-cols-2";
  }

  if (count === 3) {
    return "grid-cols-2 sm:grid-cols-3";
  }

  if (count === 4) {
    return "grid-cols-2 lg:grid-cols-4";
  }

  return "grid-cols-2 lg:grid-cols-5";
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
  const cards = [
    <MetricCard
      key="premium"
        label="Premio contratto"
        value={premiumAmount === null ? "N/D" : formatCHF(premiumAmount)}
        subtext={premiumFrequencyLabels[premiumFrequency]}
        unavailableValue={premiumAmount === null}
        variant="blue"
        icon={<Shield className="h-4 w-4" />}
    />,
    <MetricCard
      key="people"
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
    />,
    <MetricCard
      key="coverages"
        label="Coperture"
        value={coverageCount > 0 ? String(coverageCount) : "N/D"}
        subtext="raggruppate nel documento"
        unavailableValue={coverageCount === 0}
        variant="purple"
        icon={<Layers3 className="h-4 w-4" />}
    />,
    <MetricCard
      key="confidence"
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
    />,
    <MetricCard
      key="review"
        label="Revisione"
        value={requiresReview ? "Da fare" : "Ok"}
        subtext={
          completenessPercent !== null
            ? `Completezza ${completenessPercent}%`
            : "In preparazione"
        }
        variant={requiresReview ? "yellow" : "green"}
        icon={<ClipboardCheck className="h-4 w-4" />}
    />,
  ];

  return (
    <div className={cn("grid gap-2.5", getKpiGridClass(cards.length))}>
      {cards.map((card, index) => (
        <div
          key={card.key ?? index}
          className={cn(
            cards.length % 2 === 1 &&
              index === cards.length - 1 &&
              "col-span-2 lg:col-span-1"
          )}
        >
          {card}
        </div>
      ))}
    </div>
  );
}
