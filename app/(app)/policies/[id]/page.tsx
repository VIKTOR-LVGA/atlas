import { notFound } from "next/navigation";
import { PolicyCoverageIntelligence } from "@/components/policies/detail/PolicyCoverageIntelligence";
import { PolicyDetailFactsCard } from "@/components/policies/detail/PolicyDetailFactsCard";
import { PolicyDetailKpiStrip } from "@/components/policies/detail/PolicyDetailKpiStrip";
import { PolicyDetailSidebar } from "@/components/policies/detail/PolicyDetailSidebar";
import { PolicyExecutiveHeader } from "@/components/policies/detail/PolicyExecutiveHeader";
import { PolicyFlatCoveragesGrid } from "@/components/policies/detail/PolicyFlatCoveragesGrid";
import { PolicyInsuredPeopleIntelligence } from "@/components/policies/detail/PolicyInsuredPeopleIntelligence";
import { PolicyReviewCenter } from "@/components/policies/detail/PolicyReviewCenter";
import { PolicyStructureTimeline } from "@/components/policies/detail/PolicyStructureTimeline";
import { PolicyExtractionMetadataPanel } from "@/components/policies/PolicyExtractionMetadataPanel";
import { PolicyFieldConfidenceTable } from "@/components/policies/PolicyFieldConfidenceTable";
import {
  PolicyGlobalCoveragesSection,
  PolicyUnassignedCoveragesSection,
} from "@/components/policies/PolicyInsuredPeopleSection";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { atlasAsideColumn, atlasMainAside, atlasMainColumn } from "@/lib/atlas-ui";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { WarningPanel } from "@/components/ui/WarningPanel";
import {
  buildCoverageStableKey,
  buildPersonStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import { suggestPersonForCoverage } from "@/lib/health-policy-review";
import {
  buildCoverageIntelligenceSummary,
  buildPolicyReviewCenterItems,
  buildPolicyTimelineSteps,
} from "@/lib/policy-detail-display";
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

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assigned?: string; saved?: string; confirmed?: string }>;
}

export const metadata = { title: "Dettaglio polizza" };

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

  const unresolvedUnassigned = (healthGrouped?.unassignedCoverages.length ?? 0) > 0;
  const showWarningPanel =
    displayWarnings.length > 0 &&
    (policy.requiresReview || unresolvedUnassigned);

  const showGroupedHealth = shouldShowGroupedHealthUI(healthGrouped);

  const groupedForDisplay =
    healthGrouped ??
    (policy.policyType === "health" && insuredPeople.length > 0
      ? getHealthPolicyGroupedView(
          policy.details,
          policy.premiumAmount,
          policy.id
        )
      : null);

  const displayInsuredCount = groupedForDisplay?.people.length ?? insuredPeople.length;
  const displayCoverageCount = groupedForDisplay
    ? groupedForDisplay.people.reduce((sum, person) => sum + person.coverages.length, 0) +
      groupedForDisplay.unassignedCoverages.length
    : coveragesForDisplay.length || coverages.length;

  const assignPeople =
    groupedForDisplay?.people.map((person) => ({
      stableKey: buildPersonStableKey(person),
      label: person.name ?? "Persona assicurata",
    })) ?? [];

  const peopleRefs =
    groupedForDisplay?.people.map((person) => ({
      stableKey: buildPersonStableKey(person),
      name: person.name,
      insured_number: person.insured_number ?? null,
    })) ?? [];

  const unassignedAssignItems =
    groupedForDisplay?.unassignedCoverages.map((coverage) => {
      const withKey = withCoverageStableKey(coverage);
      const suggestion = suggestPersonForCoverage(withKey, peopleRefs);

      return {
        stableKey: withKey.stable_key ?? buildCoverageStableKey(withKey),
        coverage: withKey,
        suggestedPersonKey: suggestion.stableKey,
        suggestedPersonName: suggestion.name,
      };
    }) ?? [];

  const coverageSummary = buildCoverageIntelligenceSummary(
    groupedForDisplay,
    coveragesForDisplay.length > 0 ? coveragesForDisplay : coverages
  );

  const timelineSteps = buildPolicyTimelineSteps(policy, groupedForDisplay);
  const reviewCenterItems = buildPolicyReviewCenterItems({
    policy,
    uncertainFields,
    unassignedCount: groupedForDisplay?.unassignedCoverages.length ?? 0,
    warnings: displayWarnings,
    coverageSummary,
  });

  const flatCoverages =
    !showGroupedHealth && coverages.length > 0 ? coverages : [];

  return (
    <PageShell backHref="/policies" backLabel="Torna alle polizze">
      <RevealStagger>
        <PolicyExecutiveHeader
          policy={policy}
          insuredCount={displayInsuredCount}
          coverageCount={displayCoverageCount}
        />

        {assigned === "1" ? (
          <StatusFlash tone="success">
            Copertura assegnata correttamente. Il riepilogo è aggiornato.
          </StatusFlash>
        ) : null}

        {saved === "1" ? (
          <StatusFlash tone="info">
            Modifiche salvate. Puoi continuare la revisione o confermare la polizza.
          </StatusFlash>
        ) : null}

        {confirmed === "1" ? (
          <StatusFlash tone="success">
            Polizza confermata. I dati sono ora contrassegnati come verificati.
          </StatusFlash>
        ) : null}

        <PolicyDetailKpiStrip
          premiumAmount={policy.premiumAmount}
          premiumFrequency={policy.premiumFrequency}
          insuredCount={displayInsuredCount}
          coverageCount={displayCoverageCount}
          extractionConfidence={policy.extractionConfidence}
          requiresReview={policy.requiresReview}
          completenessPercent={coverageSummary.completenessPercent}
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

        <div className={atlasMainAside}>
          <div className={atlasMainColumn}>
            {groupedForDisplay && (groupedForDisplay.people.length > 0 || showGroupedHealth) ? (
              <PolicyInsuredPeopleIntelligence grouped={groupedForDisplay} />
            ) : null}

            {showGroupedHealth && groupedForDisplay ? (
              <PolicyUnassignedCoveragesSection
                policyId={policy.id}
                items={unassignedAssignItems}
                people={assignPeople}
              />
            ) : null}

            <PolicyCoverageIntelligence summary={coverageSummary} />

            {showGroupedHealth &&
            groupedForDisplay &&
            coveragesForDisplay.length > 0 ? (
              <PolicyGlobalCoveragesSection coverages={coveragesForDisplay} />
            ) : null}

            {flatCoverages.length > 0 ? (
              <PolicyFlatCoveragesGrid coverages={flatCoverages} />
            ) : null}

            <PolicyDetailFactsCard
              policy={policy}
              policyTypeLabel={policyTypeLabel}
              detailRows={detailRows.map((row) => ({
                label: row.label,
                value: row.value,
              }))}
            />

            {fieldConfidenceRows.length > 0 ? (
              <CollapsibleSection
                title="Dettaglio confidenza campi"
                description="Per revisione avanzata — dati estratti dal PDF"
                badge={
                  uncertainFields.length > 0 ? (
                    <span className="rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--warning-text)]">
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

          <aside className={atlasAsideColumn}>
            <PolicyReviewCenter
              policyId={policy.id}
              requiresReview={policy.requiresReview}
              extractionConfidence={policy.extractionConfidence}
              uncertainFieldCount={uncertainFields.length}
              items={reviewCenterItems}
            />
            <PolicyStructureTimeline steps={timelineSteps} />
            <PolicyDetailSidebar policy={policy} />
          </aside>
        </div>
      </RevealStagger>
    </PageShell>
  );
}

function StatusFlash({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "info";
}) {
  return (
    <div
      role="status"
      className={
        tone === "success"
          ? "atlas-message-enter rounded-xl border atlas-alert-success px-4 py-3 text-[13px] font-medium"
          : "atlas-message-enter rounded-xl border atlas-alert-info px-4 py-3 text-[13px] font-medium"
      }
    >
      {children}
    </div>
  );
}
