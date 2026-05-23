import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, PencilLine } from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { PolicyExtractionMetadataPanel } from "@/components/policies/PolicyExtractionMetadataPanel";
import { PolicyFieldConfidenceTable } from "@/components/policies/PolicyFieldConfidenceTable";
import { PolicyHeroSummary } from "@/components/policies/PolicyHeroSummary";
import {
  PolicyGlobalCoveragesSection,
  PolicyInsuredPeopleSection,
  PolicyUnassignedCoveragesSection,
} from "@/components/policies/PolicyInsuredPeopleSection";
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
import {
  buildCoverageStableKey,
  buildPersonStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import { suggestPersonForCoverage } from "@/lib/health-policy-review";
import {
  getHealthPolicyGroupedView,
  getPolicyCoveragesForDisplay,
  hasHealthPolicyDetailData,
  shouldShowGroupedHealthUI,
} from "@/lib/policy-health-grouping";
import { getCurrentUserPolicyById } from "@/lib/policies";
import {
  getPolicyCoverages,
  getPolicyDetailRows,
  getPolicyExtractionMetadata,
  getPolicyFieldConfidenceRows,
  getPolicyInsuredPeople,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import { formatCHF, formatDate, formatDateTime } from "@/lib/utils";
import type { PolicyPremiumFrequency } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assigned?: string; saved?: string; confirmed?: string }>;
}

export const metadata = { title: "Dettaglio polizza" };

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "Mensile",
  quarterly: "Trimestrale",
  semiannual: "Semestrale",
  annual: "Annuale",
};

export default async function PolicyDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { assigned, saved, confirmed } = await searchParams;
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
  const coveragesForDisplay = getPolicyCoveragesForDisplay(policy.details);
  const insuredPeople = getPolicyInsuredPeople(policy.details);
  const fieldConfidenceRows = getPolicyFieldConfidenceRows(policy.details);
  const uncertainFields = fieldConfidenceRows.filter((row) => row.uncertain);
  const extractionMetadata = getPolicyExtractionMetadata(policy.details);

  const healthGrouped =
    policy.policyType === "health" && hasHealthPolicyDetailData(policy.details)
      ? getHealthPolicyGroupedView(
          policy.details,
          policy.premiumAmount,
          policy.id
        )
      : null;

  const ownershipWarnings = healthGrouped?.ownershipWarnings ?? [];
  const metadataWarnings = extractionMetadata.warnings ?? [];
  const displayWarnings = [
    ...new Set(
      [...ownershipWarnings, ...metadataWarnings].filter(
        (warning) =>
          !warning.includes("Poche keyword") &&
          !warning.includes("Numero polizza non rilevato")
      )
    ),
  ].slice(0, 6);

  const unresolvedUnassigned =
    (healthGrouped?.unassignedCoverages.length ?? 0) > 0;
  const showWarningPanel =
    displayWarnings.length > 0 &&
    (policy.requiresReview || unresolvedUnassigned);

  const showGroupedHealth = shouldShowGroupedHealthUI(healthGrouped);

  const displayInsuredCount = healthGrouped?.people.length ?? insuredPeople.length;
  const displayCoverageCount = healthGrouped
    ? healthGrouped.people.reduce((sum, person) => sum + person.coverages.length, 0) +
      healthGrouped.unassignedCoverages.length
    : coveragesForDisplay.length || coverages.length;

  const assignPeople =
    healthGrouped?.people.map((person) => ({
      stableKey: buildPersonStableKey(person),
      label: person.name ?? "Persona assicurata",
    })) ?? [];

  const peopleRefs =
    healthGrouped?.people.map((person) => ({
      stableKey: buildPersonStableKey(person),
      name: person.name,
      insured_number: person.insured_number ?? null,
    })) ?? [];

  const unassignedAssignItems =
    healthGrouped?.unassignedCoverages.map((coverage) => {
      const withKey = withCoverageStableKey(coverage);
      const suggestion = suggestPersonForCoverage(withKey, peopleRefs);

      return {
        stableKey: withKey.stable_key ?? buildCoverageStableKey(withKey),
        coverage: withKey,
        suggestedPersonKey: suggestion.stableKey,
        suggestedPersonName: suggestion.name,
      };
    }) ?? [];

  return (
    <PageShell backHref="/policies" backLabel="Torna alle polizze">
      <PolicyHeroSummary policy={policy} />

      {assigned === "1" ? (
        <div
          role="status"
          className="rounded-xl border atlas-alert-success px-4 py-3 text-[13px] font-medium"
        >
          Copertura assegnata correttamente. Il riepilogo è aggiornato.
        </div>
      ) : null}

      {saved === "1" ? (
        <div
          role="status"
          className="rounded-xl border atlas-alert-info px-4 py-3 text-[13px] font-medium"
        >
          Modifiche salvate. Puoi continuare la revisione o confermare la polizza.
        </div>
      ) : null}

      {confirmed === "1" ? (
        <div
          role="status"
          className="rounded-xl border atlas-alert-success px-4 py-3 text-[13px] font-medium"
        >
          Polizza confermata. I dati sono ora contrassegnati come verificati.
        </div>
      ) : null}

      <PolicySummaryMetrics
        premiumAmount={policy.premiumAmount}
        premiumFrequency={policy.premiumFrequency}
        insuredCount={displayInsuredCount}
        coverageCount={displayCoverageCount}
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

      {showWarningPanel ? <WarningPanel items={displayWarnings} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {showGroupedHealth && healthGrouped ? (
            <>
              <PolicyInsuredPeopleSection grouped={healthGrouped} />
              <PolicyUnassignedCoveragesSection
                policyId={policy.id}
                items={unassignedAssignItems}
                people={assignPeople}
              />
              {coveragesForDisplay.length > 0 ? (
                <PolicyGlobalCoveragesSection coverages={coveragesForDisplay} />
              ) : null}
            </>
          ) : policy.policyType === "health" && insuredPeople.length > 0 ? (
            <PolicyInsuredPeopleSection
              grouped={getHealthPolicyGroupedView(
                policy.details,
                policy.premiumAmount,
                policy.id
              )}
            />
          ) : null}

          {!showGroupedHealth &&
          policy.policyType !== "health" &&
          coverages.length > 0 ? (
            <PolicyGlobalCoveragesSection coverages={coverages} />
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
              <div className="mt-4 rounded-xl bg-card-muted p-3">
                <p className="text-[10px] font-medium uppercase text-muted">
                  Note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted-foreground">
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
                className="flex items-start gap-3 rounded-xl border border-border bg-accent-soft p-3 transition hover:bg-accent-soft"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-foreground">
                    {policy.document.fileName}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-accent">
                    Apri PDF sorgente
                  </span>
                </span>
              </Link>
            ) : (
              <p className="text-[12px] leading-relaxed text-muted">
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

          <div className="rounded-xl border border-border bg-card-muted px-3 py-2.5 text-[11px] text-muted">
            <p>Aggiornata {formatDateTime(policy.updatedAt)}</p>
            <p className="mt-0.5">Creata {formatDateTime(policy.createdAt)}</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
