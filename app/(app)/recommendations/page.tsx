import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IconAlert,
  IconDocuments,
  IconPiggy,
  IconRecommendations,
  IconSparkle,
} from "@/components/icons";
import { getDashboardStats } from "@/lib/dashboard";

export const metadata = { title: "Raccomandazioni" };

export default async function RecommendationsPage() {
  const documentStats = await getDashboardStats();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Raccomandazioni"
        description="Raccomandazioni disponibili dopo l'analisi dei documenti."
        action={
          <PrimaryButton href="/documents">
            Carica una polizza PDF
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Documenti caricati"
          value={String(documentStats.totalDocuments)}
          subtext="Archivio reale"
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Raccomandazioni"
          value="In attesa"
          subtext="Nessun consiglio simulato"
          variant="indigo"
          icon={<IconRecommendations className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Alert prioritari"
          value="Non disponibili"
          subtext="Analisi richiesta"
          variant="yellow"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Risparmio"
          value="Non disponibile"
          subtext="Nessuna stima demo"
          variant="green"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Azioni consigliate"
            action={<StatusBadge variant="processing" label="Analisi in attesa" />}
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <IconSparkle className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Raccomandazioni disponibili dopo l&apos;analisi dei documenti
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                Atlas non mostra priorita, savings o scadenze inventate. Carica una polizza PDF
                per iniziare il flusso reale.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Vai ai documenti
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Moduli in attesa" padding="sm">
          <div className="space-y-2.5">
            {[
              "Priorita assicurative",
              "Correzioni di copertura",
              "Azioni e scadenze",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-slate-800">{item}</p>
                  <StatusBadge variant="neutral" label="In attesa" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
