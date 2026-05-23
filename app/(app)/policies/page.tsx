import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { IconPolicies } from "@/components/icons";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurrentUserPolicies } from "@/lib/policies";
import {
  getPolicyDetailSummary,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import { formatCHF, formatDate } from "@/lib/utils";
import type { PolicyPremiumFrequency, UserPolicy } from "@/lib/types";

export const metadata = { title: "Polizze" };

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "mensile",
  quarterly: "trimestrale",
  semiannual: "semestrale",
  annual: "annuale",
};

function PolicyPremium({ policy }: { policy: UserPolicy }) {
  if (policy.premiumAmount === null) {
    return <span className="text-slate-400">Premio da completare</span>;
  }

  return (
    <>
      {formatCHF(policy.premiumAmount)}{" "}
      <span className="font-normal text-slate-500">
        / {premiumFrequencyLabels[policy.premiumFrequency]}
      </span>
    </>
  );
}

export default async function PoliciesPage() {
  const policies = await getCurrentUserPolicies();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Le mie polizze"
        description="Polizze strutturate create dai tuoi documenti caricati."
        action={
          <PrimaryButton href="/policies/new" icon={<Plus className="h-4 w-4" />}>
            Nuova polizza
          </PrimaryButton>
        }
      />

      {policies.length > 0 ? (
        <SectionCard
          title="Archivio polizze"
          description="Schede manuali e bozze AI normalizzate dai tuoi PDF."
          padding="none"
        >
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {policies.map((policy) => {
              const policyTypeLabel = getPolicyTypeLabel(
                policy.policyType,
                policy.policyCategoryLabel
              );
              const detailSummary = getPolicyDetailSummary(
                policy.policyType,
                policy.details
              );

              return (
                <article
                  key={policy.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 transition hover:border-blue-100 hover:bg-blue-50/20"
                >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/policies/${policy.id}`} className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-slate-900">
                      {policy.provider}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">
                      {policyTypeLabel}
                    </p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge
                      variant={policy.status === "active" ? "active" : "neutral"}
                      label={policy.status === "active" ? "Attiva" : policy.status}
                    />
                    {policy.requiresReview && (
                      <StatusBadge variant="attention" label="Da rivedere" />
                    )}
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                      Premio
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      <PolicyPremium policy={policy} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                      Rinnovo
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {policy.renewalDate ? formatDate(policy.renewalDate) : "Da completare"}
                    </dd>
                  </div>
                </dl>
                {detailSummary && (
                  <p className="mt-3 truncate rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                    {detailSummary}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2 border-t border-slate-50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  {policy.document ? (
                    <Link
                      href={`/documents/${policy.document.id}`}
                      className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-blue-700 hover:text-blue-800"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{policy.document.fileName}</span>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Nessun PDF collegato
                    </span>
                  )}
                  {policy.source === "ai_draft" && (
                    <span className="text-[11px] font-medium text-indigo-600">
                      Bozza AI
                      {policy.extractionConfidence !== null
                        ? ` · ${policy.extractionConfidence}%`
                        : " · Da verificare"}
                    </span>
                  )}
                  <Link
                    href={`/policies/${policy.id}`}
                    className="text-[12px] font-medium text-slate-700 hover:text-blue-700"
                  >
                    Apri dettaglio
                  </Link>
                </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Archivio polizze"
          description="Non ci sono ancora polizze manuali per questo account."
        >
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <IconPolicies className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-slate-900">
              Nessuna polizza analizzata
            </p>
            <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
              Carica una polizza PDF per iniziare oppure crea una scheda manuale
              dai documenti gia archiviati.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <PrimaryButton href="/documents">Vai ai documenti</PrimaryButton>
              <Link
                href="/policies/new"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Crea manualmente
              </Link>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
