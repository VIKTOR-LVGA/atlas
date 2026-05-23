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
import { getDashboardStats } from "@/lib/dashboard";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Confronto mercato" };

export default async function MarketPage() {
  const [documentStats, policies] = await Promise.all([
    getDashboardStats(),
    getCurrentUserPolicies(),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Confronto mercato"
        description="Benchmark sui tuoi premi reali — disponibile dopo polizze verificate."
        action={<PrimaryButton href="/documents">Carica PDF</PrimaryButton>}
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-slate-700">
        Nessun premio o risparmio simulato: i confronti useranno solo dati estratti dai
        tuoi documenti.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
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

        <SectionCard title="Prerequisiti" padding="sm">
          <div className="space-y-3">
            {[
              {
                item: "PDF caricato",
                ready: documentStats.totalDocuments > 0,
              },
              {
                item: "Polizza estratta",
                ready: policies.length > 0,
              },
              {
                item: "Bozza verificata",
                ready: policies.some((p) => !p.requiresReview),
              },
            ].map(({ item, ready }) => (
              <div
                key={item}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"
              >
                <p className="text-[12px] font-medium text-slate-800">{item}</p>
                <StatusBadge
                  variant={ready ? "ok" : "neutral"}
                  label={ready ? "Pronto" : "In attesa"}
                />
              </div>
            ))}
            <p className="flex items-center gap-2 text-[11px] text-slate-500">
              <IconClock className="h-4 w-4" />
              Aggiornamenti automatici quando il modulo sara attivo.
            </p>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
