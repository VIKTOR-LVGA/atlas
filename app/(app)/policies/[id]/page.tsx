import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, PencilLine, Sparkles } from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { IconPolicies } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurrentUserPolicyById } from "@/lib/policies";
import { formatCHF, formatDate, formatDateTime } from "@/lib/utils";
import type { PolicyPremiumFrequency } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Dettaglio polizza" };

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

const mockConfidenceIndicators = [
  { label: "Compagnia", value: 94 },
  { label: "Tipo polizza", value: 91 },
  { label: "Premio", value: 86 },
  { label: "Franchigia", value: 82 },
] as const;

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const policy = await getCurrentUserPolicyById(id);

  if (!policy) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link href="/policies" className="text-[12px] text-slate-500 hover:text-slate-700">
        Torna alle polizze
      </Link>

      <PageHeader
        title={policy.provider}
        description={policy.policyType}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {policy.requiresReview && (
              <StatusBadge variant="attention" label="Da rivedere" />
            )}
            <StatusBadge
              variant={policy.status === "active" ? "active" : "neutral"}
              label={policy.status === "active" ? "Attiva" : policy.status}
            />
          </div>
        }
      />

      {policy.source === "ai_draft" && (
        <SectionCard
          title="Bozza estratta da Atlas"
          description="Estrazione simulata dal PDF: nessun OCR o modello esterno in questa fase."
          action={
            <StatusBadge
              variant={policy.requiresReview ? "attention" : "ok"}
              label={policy.requiresReview ? "Revisione richiesta" : "Revisionata"}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">
                    Draft precompilato
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                    Provider, tipo polizza e importi sono suggerimenti mock. Apri
                    la modifica per confermare i campi prima di usarli come dato
                    assicurativo affidabile.
                  </p>
                  <Link
                    href={`/policies/${policy.id}/edit`}
                    className="mt-3 inline-flex rounded-lg bg-white px-3.5 py-2 text-[12px] font-medium text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100 hover:bg-indigo-50"
                  >
                    Rivedi bozza
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {mockConfidenceIndicators.map((indicator) => (
                <div key={indicator.label} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-600">{indicator.label}</span>
                    <span className="text-indigo-600">{indicator.value}% mock</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${indicator.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <SectionCard title="Dati polizza" padding="md">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Compagnia</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.provider}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Tipo polizza</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.policyType}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Premio</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.premiumAmount === null
                  ? "Da completare"
                  : formatCHF(policy.premiumAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">
                Frequenza premio
              </dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {premiumFrequencyLabels[policy.premiumFrequency]}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Franchigia</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.deductible === null
                  ? "Da completare"
                  : formatCHF(policy.deductible)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Data rinnovo</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {policy.renewalDate ? formatDate(policy.renewalDate) : "Da completare"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Creata il</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatDateTime(policy.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-slate-400">Aggiornata il</dt>
              <dd className="mt-1 text-[13px] font-medium text-slate-900">
                {formatDateTime(policy.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] uppercase text-slate-400">Note</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
              {policy.notes || "Nessuna nota salvata."}
            </p>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Documento collegato" padding="md">
            {policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-slate-900">
                    {policy.document.fileName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    Apri il PDF sorgente
                  </span>
                </span>
              </Link>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Nessun PDF collegato. Puoi aggiungerlo dalla modifica della polizza.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Azioni" padding="md">
            <div className="space-y-3">
              <Link
                href={`/policies/${policy.id}/edit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
              >
                <PencilLine className="h-4 w-4" />
                Modifica polizza
              </Link>
              <PolicyDeleteForm policyId={policy.id} />
              <Link
                href="/policies"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <IconPolicies className="h-4 w-4" />
                Tutte le polizze
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
