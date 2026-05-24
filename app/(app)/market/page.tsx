import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlaceholderModule } from "@/components/ui/PlaceholderModule";
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

export const metadata = { title: "Confronto mercato" };

const prerequisites = [
  { item: "PDF caricato", key: "pdf" as const },
  { item: "Polizza estratta", key: "policy" as const },
  { item: "Bozza verificata", key: "review" as const },
];

export default async function MarketPage() {
  const [documentStats, policies] = await Promise.all([
    getDashboardStats(),
    getCurrentUserPolicies(),
  ]);

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

        <div className={atlasMainAside}>
          <div className={atlasMainColumn}>
            <SectionCard title="Benchmark assicurativo">
              <PlaceholderModule
                icon={<IconMarket className="h-6 w-6" />}
                title="Confronto mercato in preparazione"
                description="Quando avrai piu polizze verificate, Atlas confrontera premi e coperture con medie di mercato svizzere."
                statusLabel="In arrivo"
                actionLabel="Vai alle polizze"
                actionHref="/policies"
              />
            </SectionCard>
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
