import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlaceholderModule } from "@/components/ui/PlaceholderModule";
import { InsightCard } from "@/components/ui/InsightCard";
import { RevealStagger } from "@/components/motion/RevealStagger";
import {
  IconCalendar,
  IconChat,
  IconDocuments,
  IconShield,
} from "@/components/icons";
import {
  atlasAsideColumn,
  atlasKpiRow,
  atlasMainAside,
  atlasMainColumn,
  atlasSpace,
} from "@/lib/atlas-ui";
import { getDashboardStats } from "@/lib/dashboard";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Consulenza" };

export default async function ConsultingPage() {
  const [documentStats, policies] = await Promise.all([
    getDashboardStats(),
    getCurrentUserPolicies(),
  ]);

  return (
    <PageShell>
      <RevealStagger>
        <PageHeader
          title="Consulenza"
          description="Supporto umano collegato al tuo archivio assicurativo — in arrivo."
          action={<PrimaryButton href="/documents">Apri documenti</PrimaryButton>}
        />

        <div className={atlasKpiRow}>
          <MetricCard
            label="Documenti"
            value={String(documentStats.totalDocuments)}
            variant="blue"
            icon={<IconDocuments className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Polizze"
            value={String(policies.length)}
            subtext="Per briefing consulente"
            variant="indigo"
            icon={<IconChat className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Appuntamenti"
            value="—"
            subtext="Non attivi"
            variant="yellow"
            icon={<IconCalendar className="h-[18px] w-[18px]" />}
          />
          <MetricCard
            label="Report"
            value="—"
            subtext="In preparazione"
            variant="green"
            icon={<IconShield className="h-[18px] w-[18px]" />}
          />
        </div>

        <div className={atlasMainAside}>
          <div className={atlasMainColumn}>
            <SectionCard title="Sessioni consulenza">
              <PlaceholderModule
                icon={<IconChat className="h-6 w-6" />}
                title="Consulenza in preparazione"
                description="Potrai prenotare un confronto con un consulente che avra accesso alle tue polizze verificate su Atlas."
                statusLabel="Prossimamente"
                actionLabel="Prepara archivio"
                actionHref="/documents"
              />
            </SectionCard>
          </div>

          <aside className={atlasAsideColumn}>
            <SectionCard title="Cosa include" padding="sm" tone="support">
              <div className={atlasSpace.tight}>
                <InsightCard
                  icon={<IconDocuments className="h-4 w-4" />}
                  title="Review documenti"
                  description="Analisi dei PDF e delle bozze AI gia estratte."
                  statusLabel="Base pronta"
                  statusVariant={documentStats.totalDocuments > 0 ? "ok" : "neutral"}
                />
                <InsightCard
                  icon={<IconShield className="h-4 w-4" />}
                  title="Piano coperture"
                  description="Raccomandazioni su gap e ottimizzazioni."
                  statusLabel="In arrivo"
                  statusVariant="neutral"
                />
              </div>
            </SectionCard>
          </aside>
        </div>
      </RevealStagger>
    </PageShell>
  );
}
