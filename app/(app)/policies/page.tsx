import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IconAnalysis,
  IconDocuments,
  IconPlus,
  IconPolicies,
} from "@/components/icons";
import { getDashboardStats } from "@/lib/dashboard";

export default async function PoliciesPage() {
  const documentStats = await getDashboardStats();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Le mie polizze"
        description="Le polizze analizzate compariranno qui quando Atlas potra estrarle dai PDF caricati."
        action={
          <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
            Carica una polizza
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="PDF in archivio"
          value={String(documentStats.totalDocuments)}
          subtext="Documenti reali caricati"
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Polizze analizzate"
          value="In attesa"
          subtext="Estrazione non disponibile"
          variant="yellow"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Coperture"
          value="Non disponibili"
          subtext="Analisi documenti richiesta"
          variant="indigo"
          icon={<IconAnalysis className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Ultimo risultato"
          value="Nessuno"
          subtext="Nessuna polizza analizzata"
          variant="green"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Archivio polizze"
            description="Questa vista non mostra dati demo nel prodotto autenticato."
            action={<StatusBadge variant="processing" label="Analisi in attesa" />}
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconPolicies className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Nessuna polizza analizzata
              </h2>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">
                Carica una polizza PDF per iniziare. Quando il backend di analisi sara pronto,
                questa pagina mostrera polizze, coperture e scadenze reali.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Vai ai documenti
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Prossimo passaggio" padding="sm">
          <div className="space-y-3">
            {[
              "Carica i PDF assicurativi",
              "Atlas estrarra i dati di polizza",
              "Polizze e coperture appariranno qui",
            ].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">
                  {index + 1}
                </span>
                <p className="text-[12px] leading-relaxed text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
