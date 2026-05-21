import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertItem } from "@/components/ui/AlertItem";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconPiggy,
  IconShield,
  IconAlert,
  IconSparkle,
  IconRefresh,
  IconCheck,
  IconCalendar,
} from "@/components/icons";
import { recommendations, dashboardStats } from "@/lib/mock-data";
import { formatCHF } from "@/lib/utils";

export const metadata = { title: "Raccomandazioni" };

const priorityVariant = {
  high: "critical" as const,
  medium: "attention" as const,
  low: "ok" as const,
};

const checklist = [
  { id: "c1", label: "Verifica doppia copertura RC", done: true },
  { id: "c2", label: "Aggiorna somma assicurata mobilia", done: true },
  { id: "c3", label: "Confronta modello salute", done: false },
  { id: "c4", label: "Rinnova protezione giuridica", done: false },
  { id: "c5", label: "Valuta polizza viaggio", done: false },
];

export default function RecommendationsPage() {
  const done = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Raccomandazioni"
        description="Azioni prioritarie per ottimizzare il tuo portafoglio."
        action={
          <div className="flex gap-2">
            <SecondaryButton icon={<IconRefresh className="h-4 w-4" />}>
              Aggiorna raccomandazioni
            </SecondaryButton>
            <PrimaryButton icon={<IconSparkle className="h-4 w-4" />}>
              Applica raccomandazione
            </PrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Risparmio annuo potenziale"
          value={formatCHF(dashboardStats.potentialSavings.min)}
          subtext={`-${dashboardStats.savingsPercent}% del premio attuale`}
          variant="green"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
        <StatCard label="Azioni ad alta priorità" value="2" variant="red" icon={<IconAlert className="h-[18px] w-[18px]" />} />
        <StatCard label="Coperture da correggere" value="3" variant="yellow" icon={<IconShield className="h-[18px] w-[18px]" />} />
        <StatCard label="Ottimizzazioni disponibili" value="4" variant="blue" icon={<IconSparkle className="h-[18px] w-[18px]" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Azioni consigliate" action={<LinkAction href="/analysis">Vedi tutte</LinkAction>} padding="sm">
            <div className="divide-y divide-slate-50">
              {recommendations.slice(0, 4).map((rec) => (
                <AlertItem
                  key={rec.id}
                  title={rec.title}
                  description={rec.description}
                  severity={rec.priority === "high" ? "high" : rec.priority === "medium" ? "medium" : "low"}
                  icon={<IconSparkle className="h-4 w-4" />}
                />
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Risparmio rapido">
              <ul className="space-y-2 text-[12px]">
                {[
                  { t: "Modello salute family doctor", v: "CHF 420" },
                  { t: "Riduzione casco auto", v: "CHF 380" },
                ].map((item) => (
                  <li key={item.t} className="flex justify-between">
                    <span className="text-slate-700">{item.t}</span>
                    <span className="font-medium text-emerald-600">-{item.v}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Coperture da correggere">
              <ul className="space-y-2 text-[12px]">
                {["Somma mobilia", "RC sovrapposta", "Viaggio mancante"].map((t) => (
                  <li key={t} className="flex items-center justify-between">
                    <span className="text-slate-700">{t}</span>
                    <StatusBadge variant="attention" />
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard title="Priorità del mese">
            <div className="grid grid-cols-3 gap-3">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={rec.id} className="rounded-xl border border-slate-100 p-3 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-medium text-white">
                    {i + 1}
                  </span>
                  <p className="mt-2 text-[11px] font-medium text-slate-800 line-clamp-2">{rec.title}</p>
                  <StatusBadge variant={priorityVariant[rec.priority]} className="mt-2" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="Checklist raccomandazioni"
            action={
              <span className="text-[11px] font-medium text-slate-500">
                {done}/{checklist.length}
              </span>
            }
          >
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 text-[12px]">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      item.done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {item.done && <IconCheck className="h-3 w-3" />}
                  </span>
                  <span className={item.done ? "text-slate-400 line-through" : "text-slate-700"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Risparmio stimato</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatCHF(dashboardStats.potentialSavings.min)} / anno
              </p>
              <StatusBadge variant="ok" label="-26%" className="mt-1" />
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              Applica raccomandazione
            </button>
          </SectionCard>

          <SectionCard title="Prossime azioni consigliate" padding="sm">
            <ul className="space-y-2">
              {[
                { t: "Rinnovo protezione giuridica", d: 45 },
                { t: "Revisione mobilia", d: 28 },
                { t: "Scadenza RC auto", d: 145 },
              ].map((item) => (
                <li key={item.t} className="flex items-center justify-between rounded-lg border border-slate-50 px-2 py-2">
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-slate-400" />
                    <span className="text-[12px] text-slate-700">{item.t}</span>
                  </div>
                  <StatusBadge
                    variant={item.d <= 30 ? "expiring" : "neutral"}
                    label={`Tra ${item.d} gg`}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-slate-700">
        Atlas è indipendente: nessuna vendita di polizze né commissioni da assicuratori.
      </div>
    </div>
  );
}
