import { SectionCard } from "@/components/ui/SectionCard";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { formatCHF, formatDate } from "@/lib/utils";
import type { PolicyPremiumFrequency, UserPolicy } from "@/lib/types";

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

interface PolicyDetailFactsCardProps {
  policy: UserPolicy;
  policyTypeLabel: string;
  detailRows: Array<{ label: string; value: string }>;
}

function displayValue(value: string | null | undefined, fallback = "Non disponibile") {
  if (!value || value.trim() === "" || value === "Da completare") {
    return fallback;
  }
  return value;
}

export function PolicyDetailFactsCard({
  policy,
  policyTypeLabel,
  detailRows,
}: PolicyDetailFactsCardProps) {
  return (
    <SectionCard
      title="Dati contrattuali"
      description="Informazioni principali della polizza"
      bodyClassName="space-y-4"
    >
      <InfoGrid
        items={[
          { label: "Compagnia", value: displayValue(policy.provider) },
          { label: "Categoria", value: policyTypeLabel },
          {
            label: "Numero polizza",
            value: displayValue(policy.policyNumber, "Da verificare"),
          },
          {
            label: "Premio",
            value:
              policy.premiumAmount === null
                ? "Non disponibile"
                : formatCHF(policy.premiumAmount),
          },
          {
            label: "Frequenza",
            value: premiumFrequencyLabels[policy.premiumFrequency],
          },
          { label: "Valuta", value: policy.currency || "CHF" },
          {
            label: "Franchigia",
            value:
              policy.deductible === null
                ? "Non disponibile"
                : formatCHF(policy.deductible),
          },
          {
            label: "Somma copertura",
            value:
              policy.coverageAmount === null
                ? "Non disponibile"
                : formatCHF(policy.coverageAmount),
          },
          {
            label: "Inizio",
            value: policy.startDate ? formatDate(policy.startDate) : "Non disponibile",
          },
          {
            label: "Fine",
            value: policy.endDate ? formatDate(policy.endDate) : "Non disponibile",
          },
          {
            label: "Rinnovo",
            value: policy.renewalDate ? formatDate(policy.renewalDate) : "Non disponibile",
          },
        ]}
      />

      {detailRows.length > 0 ? (
        <div className="border-t border-border-subtle pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Dettagli {policyTypeLabel}
          </p>
          <InfoGrid compact items={detailRows} />
        </div>
      ) : null}

      {policy.notes ? (
        <div className="rounded-lg bg-card-muted/70 p-3">
          <p className="text-[10px] font-medium uppercase text-muted">Note</p>
          <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
            {policy.notes}
          </p>
        </div>
      ) : null}
    </SectionCard>
  );
}
