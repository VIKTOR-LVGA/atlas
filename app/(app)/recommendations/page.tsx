import { PortfolioProgressionPanel } from "@/components/onboarding/PortfolioProgressionPanel";
import { RecommendationsRefreshButton } from "@/components/recommendations/RecommendationsRefreshButton";
import { RecommendationsEmptyState } from "@/components/recommendations/RecommendationsEmptyState";
import { RecommendationsExecutiveOverview } from "@/components/recommendations/RecommendationsExecutiveOverview";
import { RecommendationsGroupedList } from "@/components/recommendations/RecommendationsGroupedList";
import { RecommendationsSidebar } from "@/components/recommendations/RecommendationsSidebar";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import {
  atlasAsideColumn,
  atlasCard,
  atlasMainAside,
  atlasMainColumn,
} from "@/lib/atlas-ui";
import { getRecommendationsIntelligence } from "@/lib/recommendations-intelligence";
import { getPortfolioProgression } from "@/lib/portfolio-progression";

export const metadata = { title: "Raccomandazioni" };

export default async function RecommendationsPage() {
  const [intelligence, progression] = await Promise.all([
    getRecommendationsIntelligence(),
    getPortfolioProgression(),
  ]);
  const {
    executive,
    groups,
    priorityActions,
    upcomingRenewals,
    workflowSteps,
    hasPortfolio,
    hasActionableRecommendations,
    readinessLabel,
  } = intelligence;

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Raccomandazioni"
          description="Prossime azioni sul portafoglio basate su dati estratti e regole verificabili — non simulazioni AI."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <RecommendationsRefreshButton />
              <PrimaryButton href="/policies">Vedi polizze</PrimaryButton>
            </div>
          }
        />

        <div className={`${atlasCard.support} px-4 py-3 text-[12px] text-muted`}>
          Atlas non mostra risparmi stimati né benchmark di mercato finché non sono
          calcolati da dati reali confermati. Ogni voce indica cosa correggere e perché.
        </div>

        <RecommendationsExecutiveOverview
          executive={executive}
          readinessLabel={readinessLabel}
        />

        {progression.showOnboardingFocus && !hasActionableRecommendations ? (
          <PortfolioProgressionPanel progression={progression} compact />
        ) : null}

        {!hasActionableRecommendations ? (
          <RecommendationsEmptyState
            hasPortfolio={hasPortfolio}
            progression={progression}
          />
        ) : (
          <div className={atlasMainAside}>
            <div className={atlasMainColumn}>
              <RecommendationsGroupedList groups={groups} />
            </div>
            <aside className={atlasAsideColumn}>
              <RecommendationsSidebar
                executive={executive}
                priorityActions={priorityActions}
                upcomingRenewals={upcomingRenewals}
                workflowSteps={workflowSteps}
              />
            </aside>
          </div>
        )}
      </RevealStagger>
    </PageShell>
  );
}
