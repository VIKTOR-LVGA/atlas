import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { ModuleUnlockGrid } from "@/components/onboarding/ModuleUnlockGrid";
import { PremiumOnboardingEmpty } from "@/components/onboarding/PremiumOnboardingEmpty";
import { PortfolioProgressionPanel } from "@/components/onboarding/PortfolioProgressionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IconClock,
  IconDocuments,
  IconMarket,
  IconPiggy,
  IconPolicies,
} from "@/components/icons";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { getDashboardStats } from "@/lib/dashboard";
import {
  atlasAsideColumn,
  atlasKpiRow,
  atlasMainAside,
  atlasMainColumn,
  atlasSpace,
} from "@/lib/atlas-ui";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getPortfolioProgression } from "@/lib/portfolio-progression";

export const metadata = { title: "Confronto mercato" };

const prerequisites = [
  { item: "PDF caricato", key: "pdf" as const },
  { item: "Polizza estratta", key: "policy" as const },
  { item: "Bozza verificata", key: "review" as const },
];

export default async function MarketPage() {
  const [documentStats, policies, progression] = await Promise.all([
    getDashboardStats(),
    getCurrentUserPolicies(),
    getPortfolioProgression(),
  ]);

  const marketUnlock = progression.unlocks.find((module) => module.id === "market");
  const confirmedCount = policies.filter((policy) => !policy.requiresReview).length;

  const readiness = {
    pdf: documentStats.totalDocuments > 0,
    policy: policies.length > 0,
    review: policies.some((policy) => !policy.requiresReview),
  };

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Confronto mercato"
          description="Benchmark sui tuoi premi reali — disponibile dopo polizze verificate."
          action={<PrimaryButton href="/documents">Carica PDF</PrimaryButton>}
        />

        <div className="atlas-card-support px-4 py-3 text-[12px] text-muted">
          Nessun premio o risparmio simulato: i confronti useranno solo dati estratti dai
          tuoi documenti.
        </div>

        <div className={atlasKpiRow}>
          <MetricCard
            label="PDF in archivio"
            value={String(documentStats.totalDocuments)}
            variant="blue"
            icon={<IconDocuments className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Polizze"
            value={String(policies.length)}
            subtext="Per benchmark futuro"
            variant="yellow"
            icon={<IconPolicies className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Risparmio stimato"
            value="—"
            subtext="Non disponibile"
            variant="green"
            icon={<IconPiggy className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Benchmark"
            value="—"
            subtext="In arrivo"
            variant="indigo"
            icon={<IconMarket className="h-[18px] w-[18px]" />}
          />
        </div>

        {progression.showOnboardingFocus ? (
          <PortfolioProgressionPanel progression={progression} compact />
        ) : null}

        <div className={atlasMainAside}>
          <div className={atlasMainColumn}>
            {marketUnlock?.unlocked ? (
              <SectionCard title="Benchmark assicurativo">
                <div className="rounded-xl border border-dashed border-border bg-card-muted/40 px-6 py-10 text-center">
                  <IconMarket className="mx-auto h-8 w-8 text-accent" />
                  <p className="mt-3 text-[14px] font-semibold text-foreground">
                    Benchmark in preparazione
                  </p>
                  <p className="mt-2 text-[12px] text-muted">
                    Hai {confirmedCount} polizze confermate. Il confronto mercato userà
                    solo i premi estratti dai tuoi documenti — nessuna simulazione.
                  </p>
                </div>
              </SectionCard>
            ) : (
              <PremiumOnboardingEmpty
                icon={<IconMarket className="h-7 w-7" />}
                title="Sblocca il confronto mercato"
                description={`Conferma almeno 3 polizze per preparare il benchmark (${confirmedCount}/3). Più dati verificati migliorano la qualità del confronto.`}
                actionLabel={marketUnlock?.ctaLabel ?? "Completa portafoglio"}
                actionHref={marketUnlock?.ctaHref ?? "/policies"}
                secondaryActionLabel="Carica PDF"
                secondaryActionHref="/documents"
                progression={progression}
                steps={[
                  {
                    step: "1",
                    title: "Conferma",
                    text: "Verifica bozze AI su premio e coperture.",
                  },
                  {
                    step: "2",
                    title: "Amplia",
                    text: "Aggiungi categorie assicurative diverse.",
                  },
                  {
                    step: "3",
                    title: "Benchmark",
                    text: "Confronto su premi reali, senza stime inventate.",
                  },
                ]}
              />
            )}
            <ModuleUnlockGrid unlocks={progression.unlocks} />
          </div>

          <aside className={atlasAsideColumn}>
            <SectionCard title="Prerequisiti" padding="sm" tone="support">
              <div className={atlasSpace.tight}>
                {prerequisites.map(({ item, key }) => {
                  const ready = readiness[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
                    >
                      <p className="text-[12px] font-medium text-foreground">{item}</p>
                      <StatusBadge
                        variant={ready ? "ok" : "neutral"}
                        label={ready ? "Pronto" : "In attesa"}
                      />
                    </div>
                  );
                })}
                <p className="flex items-center gap-2 text-[11px] text-muted">
                  <IconClock className="h-4 w-4" />
                  Aggiornamenti automatici quando il modulo sara attivo.
                </p>
              </div>
            </SectionCard>
          </aside>
        </div>
      </RevealStagger>
    </PageShell>
  );
}
