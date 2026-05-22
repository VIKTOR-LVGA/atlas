import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  IconCalendar,
  IconChat,
  IconDocuments,
  IconShield,
} from "@/components/icons";
import { getDashboardStats } from "@/lib/dashboard";

export const metadata = { title: "Consulenza" };

export default async function ConsultingPage() {
  const documentStats = await getDashboardStats();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consulenza"
        description="La consulenza verra collegata a documenti e analisi reali quando il flusso sara pronto."
        action={
          <PrimaryButton href="/documents">
            Apri documenti
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Documenti disponibili"
          value={String(documentStats.totalDocuments)}
          subtext="Upload reali"
          variant="blue"
          icon={<IconDocuments className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Consulente assegnato"
          value="In attesa"
          subtext="Nessun profilo demo"
          variant="indigo"
          icon={<IconChat className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Appuntamenti"
          value="Non disponibili"
          subtext="Calendario non attivo"
          variant="yellow"
          icon={<IconCalendar className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Report consulenza"
          value="In attesa"
          subtext="Analisi documenti richiesta"
          variant="green"
          icon={<IconShield className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Consulenza indipendente"
            action={<StatusBadge variant="processing" label="In preparazione" />}
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <IconChat className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-[16px] font-semibold text-slate-900">
                Consulenza non ancora disponibile
              </h2>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                Atlas non assegna consulenti, slot calendario o messaggi di esempio. Carica i PDF
                reali ora e la consulenza potra partire dai tuoi documenti quando sara abilitata.
              </p>
              <PrimaryButton href="/documents" className="mt-5">
                Carica una polizza PDF
              </PrimaryButton>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Preparazione" padding="sm">
          <div className="space-y-3">
            {[
              "Raccogli i PDF assicurativi",
              "Mantieni il profilo aggiornato",
              "Attendi analisi e report reali",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-100 p-3">
                <p className="text-[12px] leading-relaxed text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <p className="text-[13px] font-semibold text-slate-900">
          Atlas rimane indipendente.
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
          Le future richieste di consulenza useranno solo profilo, documenti e analisi disponibili
          per il tuo account.
        </p>
      </div>
    </div>
  );
}
