import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, PencilLine } from "lucide-react";
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
          <StatusBadge
            variant={policy.status === "active" ? "active" : "neutral"}
            label={policy.status === "active" ? "Attiva" : policy.status}
          />
        }
      />

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
