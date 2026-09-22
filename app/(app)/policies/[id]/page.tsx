import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { PolicyExperienceHero } from "@/components/policies/experience/PolicyExperienceHero";
import { PolicyExperienceTabs } from "@/components/policies/experience/PolicyExperienceTabs";
import { PolicyExperienceActions } from "@/components/policies/experience/PolicyExperienceActions";
import { PolicyOverviewTab } from "@/components/policies/experience/PolicyOverviewTab";
import { PolicyCoveragesTab } from "@/components/policies/experience/PolicyCoveragesTab";
import { PolicyDocumentTab } from "@/components/policies/experience/PolicyDocumentTab";
import { PolicyReviewTab } from "@/components/policies/experience/PolicyReviewTab";
import { PolicyOpportunitiesTab } from "@/components/policies/experience/PolicyOpportunitiesTab";
import { PolicyInsuredPeopleIntelligence } from "@/components/policies/detail/PolicyInsuredPeopleIntelligence";
import {
  PolicyGlobalCoveragesSection,
  PolicyUnassignedCoveragesSection,
} from "@/components/policies/PolicyInsuredPeopleSection";
import { getCurrentUserPolicyById } from "@/lib/policies";
import { getPolicyCoverages } from "@/lib/policy-types";
import { parsePolicyExperienceTab } from "@/lib/policy-experience/tabs";
import { buildIntelligenceOpportunities } from "@/lib/opportunities-intelligence/build";
import {
  getHealthPolicyGroupedView,
  getPolicyCoveragesForDisplay,
  hasHealthPolicyDetailData,
  shouldShowGroupedHealthUI,
} from "@/lib/policy-health-grouping";
import {
  buildCoverageStableKey,
  buildPersonStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import { suggestPersonForCoverage } from "@/lib/health-policy-review";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    view?: string;
    assigned?: string;
    saved?: string;
    confirmed?: string;
  }>;
}

export const metadata = { title: "Dettaglio polizza" };

export default async function PolicyDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view, assigned, saved, confirmed } = await searchParams;
  const policy = await getCurrentUserPolicyById(id);

  if (!policy) {
    notFound();
  }

  const activeTab = parsePolicyExperienceTab(view);
  const coverages = getPolicyCoverages(policy.details);
  const opportunityCards = buildIntelligenceOpportunities({
    policies: [policy],
    documents: [],
  }).filter(
    (card) =>
      card.ctaHref.includes(policy.id) || card.id.includes(policy.id)
  );

  const healthGrouped =
    policy.policyType === "health" && hasHealthPolicyDetailData(policy.details)
      ? getHealthPolicyGroupedView(policy.details, policy.premiumAmount, policy.id)
      : null;
  const showGroupedHealth = shouldShowGroupedHealthUI(healthGrouped);

  return (
    <PageShell backHref="/policies" backLabel="Torna alle polizze">
      <RevealStagger>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PolicyExperienceHero policy={policy} />
          </div>
          <PolicyExperienceActions
            policyId={policy.id}
            documentId={policy.documentId}
          />
        </div>

        {assigned === "1" ? (
          <StatusFlash tone="success">
            Copertura assegnata correttamente. Il riepilogo è aggiornato.
          </StatusFlash>
        ) : null}
        {saved === "1" ? (
          <StatusFlash tone="info">Modifiche salvate.</StatusFlash>
        ) : null}
        {confirmed === "1" ? (
          <StatusFlash tone="success">Polizza confermata.</StatusFlash>
        ) : null}

        <PolicyExperienceTabs policyId={policy.id} active={activeTab} />

        <div className="pt-4">
          {activeTab === "overview" ? <PolicyOverviewTab policy={policy} /> : null}

          {activeTab === "coverages" ? (
            <div className="space-y-4">
              {showGroupedHealth && healthGrouped ? (
                <>
                  <PolicyInsuredPeopleIntelligence grouped={healthGrouped} />
                  <PolicyUnassignedCoveragesSection
                    policyId={policy.id}
                    items={healthGrouped.unassignedCoverages.map((coverage) => {
                      const withKey = withCoverageStableKey(coverage);
                      const peopleRefs = healthGrouped.people.map((person) => ({
                        stableKey: buildPersonStableKey(person),
                        name: person.name,
                        insured_number: person.insured_number ?? null,
                      }));
                      const suggestion = suggestPersonForCoverage(withKey, peopleRefs);
                      return {
                        stableKey: withKey.stable_key ?? buildCoverageStableKey(withKey),
                        coverage: withKey,
                        suggestedPersonKey: suggestion.stableKey,
                        suggestedPersonName: suggestion.name,
                      };
                    })}
                    people={healthGrouped.people.map((person) => ({
                      stableKey: buildPersonStableKey(person),
                      label: person.name ?? "Persona assicurata",
                    }))}
                  />
                  <PolicyGlobalCoveragesSection
                    coverages={getPolicyCoveragesForDisplay(policy.details)}
                  />
                </>
              ) : (
                <PolicyCoveragesTab coverages={coverages} />
              )}
            </div>
          ) : null}

          {activeTab === "opportunities" ? (
            <PolicyOpportunitiesTab cards={opportunityCards} />
          ) : null}

          {activeTab === "document" ? <PolicyDocumentTab policy={policy} /> : null}

          {activeTab === "review" ? <PolicyReviewTab policy={policy} /> : null}
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
