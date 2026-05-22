import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IconClock,
  IconDocuments,
  IconMarket,
  IconPiggy,
  IconPolicies,
} from "@/components/icons";
import { getDashboardStats } from "@/lib/dashboard";

export const metadata = { title: "Confronto mercato" };

export default async function MarketPage() {
  const documentStats = await getDashboardStats();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Confronto mercato"
        description="Confronto mercato in attesa: nessun benchmark viene mostrato prima dell'analisi dei documenti."
        action={
          <PrimaryButton href="/documents">
            Carica una polizza PDF
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="PDF in archivio"
          value={String(documentStats.totalDocuments)}
          subtext="Dati reali disponibili"
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Polizze confrontabili"
          value="In attesa"
          subtext="Serve estrazione polizze"
          variant="yellow"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Risparmio stimato"
          value="Non disponibile"
          subtext="Nessun numero simulato"
          variant="green"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Benchmark"
          value="In attesa"
          subtext="Analisi documenti richiesta"
          variant="indigo"
          icon={<IconMarket className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-slate-700">
        Atlas non mostra premi, compagnie o risparmi di esempio nel prodotto autenticato.
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Benchmark assicurativo"
            action={<StatusBadge variant="processing" label="Confronto mercato in attesa" />}
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconMarket className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Confronto mercato in attesa
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                Premi, posizionamento e risparmi verranno calcolati solo su polizze reali
                analizzate dai tuoi PDF.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Vai ai documenti
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Prerequisiti" padding="sm">
          <div className="space-y-3">
            {[
              "Documento PDF caricato",
              "Dati di polizza estratti",
              "Benchmark abilitato",
            ].map((item, index) => (
              <div key={item} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-slate-800">{item}</p>
                  <StatusBadge
                    variant={index === 0 && documentStats.totalDocuments > 0 ? "ok" : "neutral"}
                    label={index === 0 && documentStats.totalDocuments > 0 ? "Pronto" : "In attesa"}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
              <IconClock className="h-4 w-4" />
              Aggiornamenti benchmark appariranno qui quando disponibili.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
