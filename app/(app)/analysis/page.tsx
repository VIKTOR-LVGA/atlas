import {
  PageHeader,
  PrimaryButton,
} from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertItem } from "@/components/ui/AlertItem";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconShield,
  IconDocuments,
  IconAnalysis,
  IconAlert,
  IconCheck,
  IconPlus,
} from "@/components/icons";
import {
  analysisItems,
  dashboardStats,
} from "@/lib/mock-data";
import { formatCHF } from "@/lib/utils";

export const metadata = { title: "Analisi" };

const workflowSteps = [
  { label: "Upload documenti", done: true },
  { label: "OCR e estrazione", done: true },
  { label: "Analisi coperture", active: true },
  { label: "Benchmark mercato", done: false },
  { label: "Raccomandazioni", done: false },
];

const categoryBreakdown = [
  { label: "Auto", count: 2, pct: 17, color: "bg-blue-500" },
  { label: "Mobilia", count: 2, pct: 17, color: "bg-amber-500" },
  { label: "RC", count: 3, pct: 25, color: "bg-violet-500" },
  { label: "Salute", count: 2, pct: 17, color: "bg-emerald-500" },
  { label: "Altro", count: 3, pct: 24, color: "bg-slate-400" },
];

export default function AnalysisPage() {
  const risks = analysisItems.filter((i) => i.severity === "high" || i.severity === "medium").slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analisi"
        description="Panoramica completa del tuo portafoglio assicurativo."
        action={
          <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
            Avvia nuova analisi
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Polizze analizzate" value="12" variant="green" icon={<IconShield className="h-[18px] w-[18px]" />} />
        <StatCard label="Documenti elaborati" value="24" variant="blue" icon={<IconDocuments className="h-[18px] w-[18px]" />} />
        <StatCard label="OCR completato" value="98%" variant="purple" icon={<IconAnalysis className="h-[18px] w-[18px]" />} />
        <StatCard label="Rischi rilevati" value="7" variant="yellow" icon={<IconAlert className="h-[18px] w-[18px]" />} />
        <StatCard
          label="Health score medio"
          value={`${dashboardStats.coverageHealthScore}/100`}
          variant="green"
          icon={<IconCheck className="h-[18px] w-[18px]" />}
          badge={<StatusBadge variant="ok" label="Buono" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Stato analisi documenti" action={<LinkAction href="/documents">Dettagli</LinkAction>}>
          <div className="flex items-center gap-6">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="85 100" />
              </svg>
              <span className="absolute text-[11px] font-semibold text-slate-800">98%</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" /> Completato (22)</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-300" /> In analisi (1)</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> In attesa (1)</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" /> Errore (1)</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Health score" action={<LinkAction href="/recommendations">Vedi</LinkAction>}>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-semibold text-slate-900">{dashboardStats.coverageHealthScore}</p>
              <p className="text-[10px] text-slate-500">/100</p>
            </div>
            <ul className="flex-1 space-y-1 text-[11px]">
              {[
                { l: "Copertura", v: 78 },
                { l: "Adeguatezza", v: 68 },
                { l: "Condizioni", v: 74 },
                { l: "Costi", v: 65 },
              ].map((s) => (
                <li key={s.l} className="flex justify-between text-slate-600">
                  <span>{s.l}</span>
                  <span className="font-medium">{s.v}%</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Rischi e criticità principali" action={<LinkAction href="/analysis">Tutti</LinkAction>} padding="sm">
          <div className="space-y-1">
            {risks.map((r) => (
              <AlertItem
                key={r.id}
                title={r.title}
                description={r.description}
                severity={r.severity}
                icon={<IconAlert className="h-4 w-4" />}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Mappa dei rischi">
          <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
            {["Alta", "Media", "Bassa"].map((row, ri) =>
              ["Alta", "Media", "Bassa"].map((col, ci) => {
                const n = ri === 0 && ci === 2 ? 3 : ri === 1 && ci === 1 ? 2 : ri === 2 && ci === 0 ? 2 : 0;
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`flex h-14 items-center justify-center rounded-lg ${
                      n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-50 text-slate-300"
                    }`}
                  >
                    {n > 0 ? n : ""}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Analisi coperture per categoria">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-slate-100 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-900">12</p>
                <p className="text-[10px] text-slate-500">Polizze</p>
              </div>
            </div>
            <ul className="flex-1 space-y-2">
              {categoryBreakdown.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[11px]">
                  <span className={`h-2 w-2 rounded-full ${c.color}`} />
                  <span className="flex-1 text-slate-600">{c.label}</span>
                  <span className="font-medium text-slate-800">{c.count}</span>
                  <span className="text-slate-400">{c.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Opportunità di miglioramento" padding="sm">
          <ul className="space-y-2">
            {[
              "Risparmio potenziale CHF 1'240/anno",
              "Correggere sottoassicurazione mobilia",
              "Eliminare doppia copertura RC",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12px] text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Trend premi annuali">
          <p className="text-2xl font-semibold text-slate-900">{formatCHF(dashboardStats.annualPremium)}</p>
          <p className="text-[11px] text-emerald-600">-8% vs. anno scorso</p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {[4200, 4500, 4600, 4700, 4830].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-blue-200"
                style={{ height: `${(v / 5000) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            {["2021", "2022", "2023", "2024", "2025"].map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Workflow di analisi">
          <ol className="space-y-3">
            {workflowSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    step.done
                      ? "bg-emerald-50 text-emerald-600"
                      : step.active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.done ? <IconCheck className="h-3 w-3" /> : step.active ? "3" : ""}
                </span>
                <span className={`text-[12px] ${step.active ? "font-medium text-slate-900" : "text-slate-600"}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Cronologia analisi" padding="sm">
          <ul className="space-y-2">
            {[
              { t: "Analisi portafoglio completa", d: "12 mag 2025" },
              { t: "Upload 3 nuove polizze", d: "8 mag 2025" },
              { t: "Benchmark mercato", d: "1 mag 2025" },
            ].map((item) => (
              <li key={item.t} className="flex items-center justify-between rounded-lg border border-slate-50 px-2 py-2">
                <div>
                  <p className="text-[12px] font-medium text-slate-800">{item.t}</p>
                  <p className="text-[10px] text-slate-400">{item.d}</p>
                </div>
                <StatusBadge variant="completed" label="Completata" />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
