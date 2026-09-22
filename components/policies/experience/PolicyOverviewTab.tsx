import type { UserPolicy } from "@/lib/types";
import { getPolicyStatusLabel, getPolicyProductName } from "@/lib/policy-consumer-display";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import { getPolicyAnnualPremium, premiumFrequencyLongLabels } from "@/lib/premium-totals";
import { formatCHF } from "@/lib/utils";
import {
  getMotorVehicleDisplay,
  MOTOR_OVERVIEW_SUPPRESSED_DETAIL_KEYS,
} from "@/lib/policy-experience/tabs";
import { getPolicyDetailRows } from "@/lib/policy-types";
import { PolicyVehicleCard } from "@/components/policies/experience/PolicyVehicleCard";
import { PolicyContractTimeline } from "@/components/policies/experience/PolicyContractTimeline";
import { PolicyPremiumBreakdown } from "@/components/policies/experience/PolicyPremiumBreakdown";
import { PolicyImportantConditions } from "@/components/policies/experience/PolicyImportantConditions";

function FactBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      <dl className="mt-2 divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 py-2.5 text-[13px]">
            <dt className="text-muted">{row.label}</dt>
            <dd className="max-w-[60%] text-right font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PolicyOverviewTab({ policy }: { policy: UserPolicy }) {
  const category = getVisualCategoryForPolicy(policy);
  const status = getPolicyStatusLabel(policy);
  const productName = getPolicyProductName(policy);
  const annual =
    (typeof policy.details?.annual_gross_premium === "number"
      ? policy.details.annual_gross_premium
      : null) ?? getPolicyAnnualPremium(policy);
  const vehicle = getMotorVehicleDisplay(policy.details as Record<string, unknown>);
  const isMotor = policy.policyType === "car";

  const detailRows = getPolicyDetailRows(policy.policyType, policy.details).filter(
    (row) => !(isMotor && MOTOR_OVERVIEW_SUPPRESSED_DETAIL_KEYS.has(row.key))
  );

  const notices: string[] = [];
  if (policy.requiresReview) {
    notices.push("Alcuni dati richiedono ancora conferma.");
  }
  if (policy.premiumAmount === null) {
    notices.push("Premio non ancora indicato.");
  }
  if (!policy.documentId) {
    notices.push("Nessun PDF collegato a questa polizza.");
  }
  if (isMotor && vehicle.leasingCompany) {
    notices.push(`Leasing: ${vehicle.leasingCompany}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <FactBlock
          title="Contratto"
          rows={[
            { label: "Compagnia", value: policy.provider || "—" },
            ...(policy.policyNumber
              ? [{ label: "Numero polizza", value: policy.policyNumber }]
              : []),
            { label: "Categoria", value: category.label },
            ...(productName ? [{ label: "Prodotto", value: productName }] : []),
            { label: "Stato", value: status },
          ]}
        />
        <FactBlock
          title="Costo"
          rows={[
            ...(annual != null
              ? [{ label: "Premio annuo totale", value: formatCHF(annual) }]
              : policy.premiumAmount != null
                ? [{ label: "Premio", value: formatCHF(policy.premiumAmount) }]
                : []),
            {
              label: "Periodicità pagamento",
              value:
                policy.details?.payment_frequency_label ||
                premiumFrequencyLongLabels[policy.premiumFrequency] ||
                "—",
            },
          ].filter((row) => row.value && row.value !== "—")}
        />
      </div>

      <PolicyContractTimeline policy={policy} />

      {isMotor ? <PolicyVehicleCard vehicle={vehicle} /> : null}

      <PolicyPremiumBreakdown policy={policy} />

      <PolicyImportantConditions policy={policy} />

      {notices.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Da sapere
          </h2>
          <ul className="mt-2 space-y-1.5">
            {notices.slice(0, 5).map((notice) => (
              <li key={notice} className="text-[13px] text-foreground">
                · {notice}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isMotor && detailRows.length > 0 ? (
        <FactBlock
          title="Dettagli"
          rows={detailRows.slice(0, 8).map((row) => ({
            label: row.label,
            value: row.value,
          }))}
        />
      ) : null}
    </div>
  );
}
