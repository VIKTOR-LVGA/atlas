import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { InfoGrid } from "@/components/ui/InfoGrid";
import type { PolicyFieldConfidenceRow } from "@/lib/policy-types";
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
  fieldConfidenceRows?: PolicyFieldConfidenceRow[];
}

function displayValue(value: string | null | undefined, fallback = "Non disponibile") {
  if (!value || value.trim() === "" || value === "Da completare") {
    return fallback;
  }
  return value;
}

function confidenceBadgeForKey(
  rows: PolicyFieldConfidenceRow[] | undefined,
  key: string
) {
  const row = rows?.find((item) => item.key === key);
  if (!row) {
    return undefined;
  }

  return (
    <ConfidenceBadge confidence={row.confidence} uncertain={row.uncertain} />
  );
}

export function PolicyDetailFactsCard({
  policy,
  policyTypeLabel,
  detailRows,
  fieldConfidenceRows,
}: PolicyDetailFactsCardProps) {
  return (
    <SectionCard
      title="Dati contrattuali"
      description="Campi estratti con indicatori di verifica"
      bodyClassName="space-y-4"
    >
      <InfoGrid
        items={[
          {
            label: "Compagnia",
            value: displayValue(policy.provider),
            badge: confidenceBadgeForKey(fieldConfidenceRows, "provider"),
          },
          {
            label: "Categoria",
            value: policyTypeLabel,
            badge: confidenceBadgeForKey(fieldConfidenceRows, "policy_type"),
          },
          {
            label: "Numero polizza",
            value: displayValue(policy.policyNumber, "Da verificare"),
            badge: confidenceBadgeForKey(fieldConfidenceRows, "policy_number"),
          },
          {
            label: "Premio",
            value:
              policy.premiumAmount === null
                ? "Non disponibile"
                : formatCHF(policy.premiumAmount),
            badge: confidenceBadgeForKey(fieldConfidenceRows, "premium_amount"),
          },
          {
            label: "Frequenza",
            value: premiumFrequencyLabels[policy.premiumFrequency],
            badge: confidenceBadgeForKey(fieldConfidenceRows, "premium_frequency"),
          },
          { label: "Valuta", value: policy.currency || "CHF" },
          {
            label: "Franchigia",
            value:
              policy.deductible === null
                ? "Non disponibile"
                : formatCHF(policy.deductible),
            badge: confidenceBadgeForKey(fieldConfidenceRows, "deductible"),
          },
          {
            label: "Somma copertura",
            value:
              policy.coverageAmount === null
                ? "Non disponibile"
                : formatCHF(policy.coverageAmount),
            badge: confidenceBadgeForKey(fieldConfidenceRows, "coverage_amount"),
          },
          {
            label: "Inizio",
            value: policy.startDate ? formatDate(policy.startDate) : "Non disponibile",
            badge: confidenceBadgeForKey(fieldConfidenceRows, "start_date"),
          },
          {
            label: "Fine",
            value: policy.endDate ? formatDate(policy.endDate) : "Non disponibile",
            badge: confidenceBadgeForKey(fieldConfidenceRows, "end_date"),
          },
          {
            label: "Rinnovo",
            value: policy.renewalDate ? formatDate(policy.renewalDate) : "Non disponibile",
            badge: confidenceBadgeForKey(fieldConfidenceRows, "renewal_date"),
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
