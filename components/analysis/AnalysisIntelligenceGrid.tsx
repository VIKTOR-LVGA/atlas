import Link from "next/link";
import { Users } from "lucide-react";
import {
  AnalysisCompletenessBars,
  AnalysisDonutChart,
  AnalysisHorizontalBars,
  AnalysisSegmentLegend,
} from "@/components/analysis/AnalysisChartPrimitives";
import { AnalysisInsightList } from "@/components/analysis/AnalysisInsightList";
import { DashboardWorkflowSteps } from "@/components/dashboard/DashboardWorkflowSteps";
import { SectionCard } from "@/components/ui/SectionCard";
import type { AnalysisIntelligence } from "@/lib/analysis-intelligence";
import { formatCHF, formatDate } from "@/lib/utils";
import { atlasAsideColumn, atlasMainAside, atlasMainColumn, atlasSpace } from "@/lib/atlas-ui";
import { cn } from "@/lib/utils";

interface AnalysisIntelligenceGridProps {
  intelligence: AnalysisIntelligence;
}

function ModuleEmpty({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-[11px] text-muted-foreground">{message}</p>
  );
}

export function AnalysisIntelligenceGrid({ intelligence }: AnalysisIntelligenceGridProps) {
  const {
    documentPipeline,
    policiesByCategory,
    reviewStatus,
    confidenceBuckets,
    completeness,
    premiumByCategory,
    renewalTimeline,
    familyOverview,
    insights,
    workflowSteps,
    executive,
  } = intelligence;

  const completenessItems = [
    {
      label: "Premio estratto",
      value: completeness.withPremium,
      total: completeness.confirmedTotal,
    },
    {
      label: "Data rinnovo",
      value: completeness.withRenewal,
      total: completeness.confirmedTotal,
    },
    {
      label: "Franchigia / scoperto",
      value: completeness.withDeductible,
      total: completeness.confirmedTotal,
    },
    {
      label: "PDF collegato",
      value: completeness.withLinkedDocument,
      total: completeness.confirmedTotal,
    },
  ];

  return (
    <div className={atlasMainAside}>
      <div className={atlasMainColumn}>
        <div className={`${atlasSpace.cardGrid} md:grid-cols-2`}>
          <SectionCard
            title="Pipeline documenti"
            description="Stato reale dell'archivio PDF."
            padding="sm"
          >
            {documentPipeline.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <AnalysisDonutChart
                  segments={documentPipeline}
                  centerValue={
                    executive.documentProcessingPercent !== null
                      ? `${executive.documentProcessingPercent}%`
                      : undefined
                  }
                  centerLabel="analizzati"
                />
                <AnalysisSegmentLegend segments={documentPipeline} />
              </div>
            ) : (
              <ModuleEmpty message="Nessun documento nell'archivio." />
            )}
          </SectionCard>

          <SectionCard
            title="Polizze per categoria"
            description="Distribuzione del portafoglio strutturato."
            padding="sm"
          >
            {policiesByCategory.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <AnalysisDonutChart
                  segments={policiesByCategory}
                  centerValue={String(intelligence.kpis.totalPolicies)}
                  centerLabel="polizze"
                />
                <AnalysisSegmentLegend segments={policiesByCategory} />
              </div>
            ) : (
              <ModuleEmpty message="Servono più polizze analizzate." />
            )}
          </SectionCard>
        </div>

        <div className={`${atlasSpace.cardGrid} md:grid-cols-2`}>
          <SectionCard
            title="Premio per categoria"
            description="Solo polizze confermate con premio disponibile."
            padding="sm"
          >
            <AnalysisHorizontalBars
              segments={premiumByCategory}
              formatValue={(value) => formatCHF(value)}
            />
          </SectionCard>

          <SectionCard
            title="Completezza dati"
            description="Campi critici sulle polizze confermate."
            padding="sm"
          >
            {completeness.confirmedTotal > 0 ? (
              <AnalysisCompletenessBars items={completenessItems} />
            ) : (
              <ModuleEmpty message="Conferma le bozze per misurare la completezza." />
            )}
          </SectionCard>
        </div>

        <div className={`${atlasSpace.cardGrid} md:grid-cols-2`}>
          <SectionCard
            title="Stato revisione"
            description="Origine e conferma delle schede."
            padding="sm"
          >
            {reviewStatus.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <AnalysisDonutChart segments={reviewStatus} size={100} />
                <AnalysisSegmentLegend segments={reviewStatus} />
              </div>
            ) : (
              <ModuleEmpty message="Nessuna polizza strutturata." />
            )}
          </SectionCard>

          <SectionCard
            title="Qualità estrazione"
            description="Distribuzione confidenza AI sulle polizze."
            padding="sm"
          >
            {confidenceBuckets.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <AnalysisDonutChart segments={confidenceBuckets} size={100} />
                <AnalysisSegmentLegend segments={confidenceBuckets} />
              </div>
            ) : (
              <ModuleEmpty message="Confidenza non disponibile sulle polizze attuali." />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Persone e coperture"
          description="Panoramica familiare dal portafoglio estratto."
          padding="sm"
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Persone",
                value: familyOverview.insuredPeople,
              },
              {
                label: "Coperture",
                value: familyOverview.coverages,
              },
              {
                label: "Da assegnare",
                value: familyOverview.unassignedCoverages,
                warn: familyOverview.unassignedCoverages > 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2.5 text-center"
              >
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-lg font-semibold tabular-nums",
                    item.warn ? "text-[var(--warning-text)]" : "text-foreground"
                  )}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {familyOverview.insuredPeople === 0 && familyOverview.coverages === 0 ? (
            <p className="mt-3 text-center text-[11px] text-muted">
              Nessuna persona o copertura estratta ancora.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Timeline rinnovi"
          description="Prossime scadenze da date reali di rinnovo."
          padding="sm"
        >
          {renewalTimeline.length > 0 ? (
            <ul className={atlasSpace.tight}>
              {renewalTimeline.map((item) => (
                <li key={item.policyId}>
                  <Link
                    href={`/policies/${item.policyId}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2 transition hover:bg-card-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-muted">
                        {formatDate(item.renewalDate)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        item.daysUntil <= 30
                          ? "bg-[var(--warning-bg)] text-[var(--warning-text)]"
                          : "bg-card-muted text-muted"
                      )}
                    >
                      {item.daysUntil < 0
                        ? `Scaduta`
                        : item.daysUntil === 0
                          ? "Oggi"
                          : `Tra ${item.daysUntil}g`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ModuleEmpty message="Nessuna data di rinnovo disponibile." />
          )}
        </SectionCard>
      </div>

      <aside className={atlasAsideColumn}>
        <SectionCard
          title="Workflow analisi"
          description="Caricamento → Analisi → Revisione → Portafoglio aggiornato."
          padding="sm"
        >
          <DashboardWorkflowSteps steps={workflowSteps} />
        </SectionCard>

        <SectionCard
          title="Insight Atlas"
          description="Segnali deterministici dai tuoi dati — non previsioni AI."
          padding="sm"
          bodyClassName="px-3.5"
        >
          <AnalysisInsightList insights={insights} />
        </SectionCard>

        {!intelligence.hasConfirmedPortfolio && intelligence.hasPortfolio ? (
          <div className="atlas-action-strip">
            <div className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div>
                <p className="text-[12px] font-semibold text-foreground">
                  Conferma le bozze per sbloccare l&apos;analisi
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Moduli premium e distribuzione premi richiedono polizze verificate.
                </p>
                <Link href="/policies" className="mt-2 inline-flex text-[11px] font-medium text-accent">
                  Vai alle polizze →
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="atlas-card-support px-4 py-3 text-[11px] leading-relaxed text-muted">
          Benchmark di mercato, risparmi stimati e score predittivi restano in
          preparazione. Questa pagina mostra solo metriche calcolate dai dati
          caricati.
        </div>
      </aside>
    </div>
  );
}
