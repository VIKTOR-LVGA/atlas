import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlaceholderModule } from "@/components/ui/PlaceholderModule";
import {
  IconAlert,
  IconDocuments,
  IconPiggy,
  IconRecommendations,
} from "@/components/icons";
import { getDashboardStats } from "@/lib/dashboard";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Raccomandazioni" };

export default async function RecommendationsPage() {
  const [documentStats, policies] = await Promise.all([
    getDashboardStats(),
    getCurrentUserPolicies(),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Raccomandazioni"
        description="Suggerimenti personalizzati basati sulle tue polizze reali."
        action={<PrimaryButton href="/policies">Vedi polizze</PrimaryButton>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Documenti"
          value={String(documentStats.totalDocuments)}
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Polizze"
          value={String(policies.length)}
          subtext="Base per suggerimenti"
          variant="indigo"
          icon={<IconRecommendations className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Priorita alta"
          value="—"
          subtext="In arrivo"
          variant="yellow"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Risparmio potenziale"
          value="—"
          subtext="Non stimato"
          variant="green"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
      </div>

      <SectionCard title="Raccomandazioni AI">
        <PlaceholderModule
          icon={<IconRecommendations className="h-6 w-6" />}
          title={
            policies.length > 0
              ? "Suggerimenti in preparazione"
              : "Serve almeno una polizza"
          }
          description={
            policies.length > 0
              ? "Atlas analizzera gap, sovrapposizioni e opportunita quando il motore raccomandazioni sara collegato alle tue schede."
              : "Carica e analizza un PDF per costruire la base delle raccomandazioni."
          }
          statusLabel={policies.length > 0 ? `${policies.length} polizze` : "In attesa"}
          actionLabel="Carica PDF"
          actionHref="/documents"
        />
      </SectionCard>
    </PageShell>
  );
}
