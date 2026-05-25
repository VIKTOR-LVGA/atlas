import Link from "next/link";
import { UserCheck } from "lucide-react";
import { ConsultingEmptyState } from "@/components/consulting/ConsultingEmptyState";
import { ConsultingExpertOverview } from "@/components/consulting/ConsultingExpertOverview";
import { ConsultingFutureModulesGrid } from "@/components/consulting/ConsultingFutureModulesGrid";
import { ConsultingInterestCta } from "@/components/consulting/ConsultingInterestCta";
import { ConsultingPortfolioSnapshot } from "@/components/consulting/ConsultingPortfolioSnapshot";
import { ConsultingPreparationChecklist } from "@/components/consulting/ConsultingPreparationChecklist";
import { ConsultingReadinessHero } from "@/components/consulting/ConsultingReadinessHero";
import { PortfolioProgressionPanel } from "@/components/onboarding/PortfolioProgressionPanel";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { RevealStagger } from "@/components/motion/RevealStagger";
import {
  atlasAsideColumn,
  atlasCard,
  atlasMainAside,
  atlasMainColumn,
  atlasSpace,
} from "@/lib/atlas-ui";
import { getConsultingIntelligence } from "@/lib/consulting-intelligence";

export const metadata = { title: "Consulenza" };

export default async function ConsultingPage() {
  const intelligence = await getConsultingIntelligence();
  const { readiness, hasInsufficientData, progression } = intelligence;

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Revisione umana"
          description="Atlas prepara il tuo portafoglio per una futura revisione con esperto — readiness deterministica, senza prenotazioni simulate."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/recommendations"
                className="atlas-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-[12px]"
              >
                Raccomandazioni
              </Link>
              <PrimaryButton href="/documents" icon={<UserCheck className="h-4 w-4" />}>
                Prepara dossier
              </PrimaryButton>
            </div>
          }
        />

        <div className={`${atlasCard.support} px-4 py-3 text-[12px] text-muted`}>
          Nessun consulente, calendario, prezzo o messaggio simulato. I controlli descrivono
          cosa un revisore potrà analizzare quando il servizio sarà disponibile.
        </div>

        <ConsultingReadinessHero readiness={readiness} />

        {hasInsufficientData ? (
          <>
            <ConsultingEmptyState intelligence={intelligence} />
            {progression.showOnboardingFocus ? (
              <PortfolioProgressionPanel progression={progression} compact />
            ) : null}
          </>
        ) : (
          <>
            <ConsultingPortfolioSnapshot snapshot={intelligence.snapshot} />

            <div className={atlasMainAside}>
              <div className={`${atlasMainColumn} ${atlasSpace.block}`}>
                <ConsultingPreparationChecklist items={intelligence.checklist} />
                <ConsultingExpertOverview topics={intelligence.expertTopics} />
                <ConsultingFutureModulesGrid modules={intelligence.futureModules} />
              </div>

              <aside className={atlasAsideColumn}>
                <ConsultingInterestCta readinessPercent={readiness.percent} />
                {progression.showOnboardingFocus ? (
                  <PortfolioProgressionPanel progression={progression} compact />
                ) : null}
              </aside>
            </div>
          </>
        )}

        <div
          className={`${atlasCard.secondary} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Indipendente e in preparazione
              </p>
              <p className="text-[12px] text-muted">
                {intelligence.snapshot.confirmedPolicies} polizza
                {intelligence.snapshot.confirmedPolicies === 1 ? "" : "e"} confermata
                {intelligence.snapshot.confirmedPolicies === 1 ? "" : "e"} nel dossier.
                Servizio consulenza non ancora attivo.
              </p>
            </div>
          </div>
          <Link
            href="/policies"
            className="shrink-0 rounded-lg border border-border px-4 py-2 text-[12px] font-medium text-muted-foreground hover:bg-card-muted"
          >
            Completa portafoglio
          </Link>
        </div>
      </RevealStagger>
    </PageShell>
  );
}
