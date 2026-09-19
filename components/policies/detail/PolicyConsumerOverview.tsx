import Link from "next/link";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { getPolicyCoverages, getPolicyDetailRows } from "@/lib/policy-types";
import { getPolicyProductName, getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import {
  getPolicyAnnualPremium,
  premiumFrequencyLongLabels,
} from "@/lib/premium-totals";
import { formatScheduleDateFull } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";

function FactList({
  title,
  facts,
}: {
  title: string;
  facts: Array<{ label: string; value: string | null | undefined }>;
}) {
  const visible = facts.filter((fact) => Boolean(fact.value));
  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="atlas-consumer-card px-5 py-4">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
      <dl className="mt-1 divide-y divide-border-subtle">
        {visible.map((fact) => (
          <div key={fact.label} className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-[13px] text-muted">{fact.label}</dt>
            <dd className="max-w-[65%] text-right text-[13px] font-medium text-foreground">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PolicyConsumerOverview({ policy }: { policy: UserPolicy }) {
  const category = getVisualCategoryForPolicy(policy);
  const productName = getPolicyProductName(policy);
  const annual = getPolicyAnnualPremium(policy);
  const coverages = getPolicyCoverages(policy.details);
  const detailRows = getPolicyDetailRows(policy.policyType, policy.details);
  const status = getPolicyStatusLabel(policy);

  return (
    <div className="space-y-3">
      <header className="pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {category.label}
        </p>
        <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-foreground">
          {policy.provider?.trim() || "Polizza da completare"}
        </h1>
        <p className="mt-1 text-[13px] text-muted">{status}</p>
      </header>

      <FactList
        title="Overview"
        facts={[
          { label: "Tipo", value: category.label },
          { label: "Compagnia", value: policy.provider },
          { label: "Prodotto", value: productName },
          { label: "Numero polizza", value: policy.policyNumber },
          { label: "Stato", value: status },
        ]}
      />

      <FactList
        title="Costi"
        facts={[
          {
            label: "Premio",
            value: policy.premiumAmount !== null ? formatCHF(policy.premiumAmount) : null,
          },
          {
            label: "Periodicità",
            value:
              policy.premiumAmount !== null
                ? premiumFrequencyLongLabels[policy.premiumFrequency]
                : null,
          },
          {
            label: "Premio annualizzato",
            value: annual !== null ? formatCHF(annual) : null,
          },
          {
            label: "Franchigia",
            value: policy.deductible !== null ? formatCHF(policy.deductible) : null,
          },
        ]}
      />

      <FactList
        title="Date"
        facts={[
          {
            label: "Inizio",
            value: policy.startDate ? formatScheduleDateFull(policy.startDate) : null,
          },
          {
            label: "Scadenza",
            value: policy.endDate ? formatScheduleDateFull(policy.endDate) : null,
          },
          {
            label: "Rinnovo",
            value: policy.renewalDate ? formatScheduleDateFull(policy.renewalDate) : null,
          },
        ]}
      />

      <FactList
        title="Dettagli"
        facts={detailRows.map((row) => ({ label: row.label, value: row.value }))}
      />

      {coverages.length > 0 ? (
        <section className="atlas-consumer-card px-5 py-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
            Coperture
          </h2>
          <ul className="mt-3 space-y-2">
            {coverages.map((coverage, index) => (
              <li key={`${coverage.name}-${index}`} className="text-[13px] text-foreground">
                {coverage.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="atlas-consumer-card px-5 py-4">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
          Documenti
        </h2>
        {policy.document ? (
          <Link
            href={`/documents/${policy.document.id}`}
            className="mt-3 block truncate text-[14px] font-medium text-accent"
          >
            {policy.document.fileName}
          </Link>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Nessun documento collegato.</p>
        )}
      </section>

      {policy.notes?.trim() ? (
        <section className="atlas-consumer-card px-5 py-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
            Note
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
            {policy.notes}
          </p>
        </section>
      ) : null}

      <section className="atlas-consumer-card space-y-2 px-5 py-4">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
          Azioni
        </h2>
        <div className="flex flex-col gap-2">
          <Link
            href={`/policies/${policy.id}/edit`}
            className="atlas-btn-primary flex min-h-11 w-full items-center justify-center px-4 text-[13px]"
          >
            Modifica
          </Link>
          <Link
            href="/documents"
            className="atlas-btn-secondary flex min-h-11 w-full items-center justify-center px-4 text-[13px]"
          >
            Carica documento
          </Link>
          <PolicyDeleteForm policyId={policy.id} />
        </div>
      </section>
    </div>
  );
}
