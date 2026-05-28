import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { DashboardWorkflowSteps } from "@/components/dashboard/DashboardWorkflowSteps";
import { SectionCard } from "@/components/ui/SectionCard";
import { LinkAction } from "@/components/ui/LinkAction";
import type {
  AtlasRecommendation,
  RecommendationsExecutiveOverview,
} from "@/lib/recommendations-intelligence";
import type { DashboardWorkflowStep } from "@/lib/dashboard-intelligence";
import { atlasSpace } from "@/lib/atlas-ui";

interface RecommendationsSidebarProps {
  executive: RecommendationsExecutiveOverview;
  priorityActions: AtlasRecommendation[];
  upcomingRenewals: AtlasRecommendation[];
  workflowSteps: DashboardWorkflowStep[];
}

export function RecommendationsSidebar({
  executive,
  priorityActions,
  upcomingRenewals,
  workflowSteps,
}: RecommendationsSidebarProps) {
  const pendingCount = executive.totalRecommendations;

  return (
    <>
      <SectionCard
        title="Priorità immediate"
        description="Le azioni più urgenti sul tuo portafoglio"
        tone="primary"
        padding="sm"
        bodyClassName={atlasSpace.tight}
      >
        {priorityActions.length > 0 ? (
          priorityActions.map((item) => (
            <RecommendationCard key={item.id} recommendation={item} compact />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card-muted/40 px-3 py-6 text-center">
            <p className="text-[12px] font-medium text-foreground">
              Nessuna priorità alta
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Continua a confermare le polizze per mantenere il portafoglio allineato.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Progresso azioni"
        description="Basato sulle raccomandazioni attive"
        tone="support"
        padding="sm"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-accent/30 bg-accent-soft text-center"
            aria-label={`${pendingCount} azioni consigliate`}
          >
            <span className="text-[13px] font-semibold tabular-nums text-accent">
              {pendingCount}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground">
              {pendingCount === 0
                ? "Nessuna azione pendente"
                : `${pendingCount} azioni da valutare`}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {executive.highPriorityCount > 0
                ? `${executive.highPriorityCount} con priorità alta`
                : "Le stime di risparmio saranno disponibili con il confronto mercato."}
            </p>
          </div>
        </div>
        <Link
          href="/policies"
          className="atlas-btn-primary mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-[13px] shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Vai al portafoglio
        </Link>
        <p className="mt-2 text-center text-[10px] text-muted">
          Modifiche guidate · nessuna promessa AI non verificata
        </p>
      </SectionCard>

      {upcomingRenewals.length > 0 ? (
        <SectionCard
          title="Prossimi rinnovi"
          description="Scadenze entro 60 giorni"
          padding="sm"
          bodyClassName={atlasSpace.tight}
        >
          {upcomingRenewals.map((item) => (
            <RecommendationCard key={item.id} recommendation={item} compact />
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Percorso Atlas"
        description="Da documento a portafoglio verificato"
        padding="sm"
      >
        <DashboardWorkflowSteps steps={workflowSteps} />
        <div className="mt-3 flex justify-center">
          <LinkAction href="/analysis">Apri centro analisi</LinkAction>
        </div>
      </SectionCard>

      <div className="atlas-card-support px-4 py-3 text-[11px] leading-relaxed text-muted">
        Le raccomandazioni derivano da regole deterministiche sui tuoi PDF e
        polizze. I benchmark di mercato saranno disponibili quando attivi.
      </div>
    </>
  );
}
