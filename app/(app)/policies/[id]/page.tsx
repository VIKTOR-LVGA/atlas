import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, PencilLine } from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { PolicyCoverageCard } from "@/components/policies/PolicyCoverageCard";
import { PolicyExtractionMetadataPanel } from "@/components/policies/PolicyExtractionMetadataPanel";
import { PolicyFieldConfidenceTable } from "@/components/policies/PolicyFieldConfidenceTable";
import { PolicyHeroSummary } from "@/components/policies/PolicyHeroSummary";
import { PolicyInsuredPersonCard } from "@/components/policies/PolicyInsuredPersonCard";
import { PolicyProductCard } from "@/components/policies/PolicyProductCard";
import { PolicySummaryMetrics } from "@/components/policies/PolicySummaryMetrics";
import { IconPolicies } from "@/components/icons";
import { ActionBar, ActionButton } from "@/components/ui/ActionBar";
import { AIExtractionCard } from "@/components/ui/AIExtractionCard";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { InfoGrid } from "@/components/ui/InfoGrid";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { getCurrentUserPolicyById } from "@/lib/policies";
import {
  getPolicyCoverages,
  getPolicyDetailRows,
  getPolicyExtractionMetadata,
  getPolicyFieldConfidenceRows,
  getPolicyInsuredPeople,
  getPolicyProducts,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
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

  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const detailRows = getPolicyDetailRows(policy.policyType, policy.details);
  const coverages = getPolicyCoverages(policy.details);
  const insuredPeople = getPolicyInsuredPeople(policy.details);
  const products = getPolicyProducts(policy.details);
  const fieldConfidenceRows = getPolicyFieldConfidenceRows(policy.details);
  const uncertainFields = fieldConfidenceRows.filter((row) => row.uncertain);
  const extractionMetadata = getPolicyExtractionMetadata(policy.details);
  const userWarnings = extractionMetadata.warnings ?? [];

  return (
    <PageShell backHref="/policies" backLabel="Torna alle polizze">
      <PolicyHeroSummary policy={policy} />

      <PolicySummaryMetrics
        premiumAmount={policy.premiumAmount}
        premiumFrequency={policy.premiumFrequency}
        insuredCount={insuredPeople.length}
        coverageCount={coverages.length}
        extractionConfidence={policy.extractionConfidence}
      />

      {policy.requiresReview ? (
        <ReviewBanner
          title="Bozza AI da confermare"
          description="Atlas ha estratto i dati dal PDF. Verifica premio, persone e coperture prima di considerarli affidabili."
          editHref={`/policies/${policy.id}/edit`}
          uncertainCount={uncertainFields.length}
        />
      ) : null}

      {userWarnings.length > 0 ? (
        <WarningPanel items={userWarnings} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {coverages.length > 0 ? (
            <SectionCard
              title="Coperture rilevate"
              description="Prodotti e garanzie presenti nel documento."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {coverages.map((coverage, index) => (
                  <PolicyCoverageCard
                    key={`${coverage.name}-${index}`}
                    coverage={coverage}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {insuredPeople.length > 0 ? (
            <SectionCard
              title="Persone assicurate"
              description="Premi e franchigie per componente familiare."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {insuredPeople.map((person, index) => (
                  <PolicyInsuredPersonCard
                    key={`${person.name ?? "insured"}-${index}`}
                    person={person}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {products.length > 0 ? (
            <SectionCard title="Prodotti estratti">
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map((product, index) => (
                  <PolicyProductCard
                    key={`${product.name}-${index}`}
                    product={product}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Dati polizza">
            <InfoGrid
              items={[
                { label: "Compagnia", value: policy.provider },
                { label: "Categoria", value: policyTypeLabel },
                {
                  label: "Numero polizza",
                  value: policy.policyNumber ?? "Da completare",
                },
                {
                  label: "Premio",
                  value:
                    policy.premiumAmount === null
                      ? "Da completare"
                      : formatCHF(policy.premiumAmount),
                },
                {
                  label: "Frequenza",
                  value: premiumFrequencyLabels[policy.premiumFrequency],
                },
                { label: "Valuta", value: policy.currency },
                {
                  label: "Franchigia",
                  value:
                    policy.deductible === null
                      ? "Da completare"
                      : formatCHF(policy.deductible),
                },
                {
                  label: "Somma copertura",
                  value:
                    policy.coverageAmount === null
                      ? "Da completare"
                      : formatCHF(policy.coverageAmount),
                },
                {
                  label: "Inizio",
                  value: policy.startDate
                    ? formatDate(policy.startDate)
                    : "Da completare",
                },
                {
                  label: "Fine",
                  value: policy.endDate
                    ? formatDate(policy.endDate)
                    : "Da completare",
                },
                {
                  label: "Rinnovo",
                  value: policy.renewalDate
                    ? formatDate(policy.renewalDate)
                    : "Da completare",
                },
              ]}
            />
            {policy.notes ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">
                  {policy.notes}
                </p>
              </div>
            ) : null}
          </SectionCard>

          {detailRows.length > 0 ? (
            <SectionCard title={`Dettagli ${policyTypeLabel}`}>
              <InfoGrid
                compact
                items={detailRows.map((row) => ({
                  label: row.label,
                  value: row.value,
                }))}
              />
            </SectionCard>
          ) : null}

          {fieldConfidenceRows.length > 0 ? (
            <CollapsibleSection
              title="Confidenza per campo"
              description="Dettaglio tecnico dell'estrazione"
              badge={
                uncertainFields.length > 0 ? (
                  <span className="text-[10px] font-medium text-amber-700">
                    {uncertainFields.length} incerti
                  </span>
                ) : null
              }
            >
              <PolicyFieldConfidenceTable rows={fieldConfidenceRows} />
            </CollapsibleSection>
          ) : null}

          <PolicyExtractionMetadataPanel metadata={extractionMetadata} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {policy.source === "ai_draft" ? (
            <AIExtractionCard
              confidence={policy.extractionConfidence}
              notes={policy.extractionNotes}
              uncertainCount={uncertainFields.length}
            />
          ) : null}

          <SectionCard title="Documento collegato" padding="sm">
            {policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 transition hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-slate-900">
                    {policy.document.fileName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-blue-700">
                    Apri PDF sorgente
                  </span>
                </span>
              </Link>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Nessun PDF collegato.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Azioni" padding="sm">
            <ActionBar>
              <ActionButton href={`/policies/${policy.id}/edit`} variant="primary">
                <PencilLine className="h-4 w-4" />
                Modifica polizza
              </ActionButton>
              <PolicyDeleteForm policyId={policy.id} />
              <ActionButton href="/policies" variant="secondary">
                <IconPolicies className="h-4 w-4" />
                Tutte le polizze
              </ActionButton>
            </ActionBar>
          </SectionCard>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-[11px] text-slate-500">
            <p>Aggiornata {formatDateTime(policy.updatedAt)}</p>
            <p className="mt-0.5">Creata {formatDateTime(policy.createdAt)}</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
