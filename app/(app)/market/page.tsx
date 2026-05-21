import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkAction } from "@/components/ui/LinkAction";
import { IconClock, IconAlert, IconPiggy, IconPolicies } from "@/components/icons";
import { benchmarks, dashboardStats } from "@/lib/mock-data";
import { formatCHF, cn } from "@/lib/utils";
import { categoryIconBg, PolicyCategoryIcon } from "@/lib/policy-ui";
import type { PolicyCategory } from "@/lib/types";

export const metadata = { title: "Confronto mercato" };

const catMap: Record<string, PolicyCategory> = {
  health: "health",
  car: "car",
  household: "household",
  liability: "liability",
  legal: "legal",
};

const alternatives = [
  { name: "Allianz", premium: 4200, saving: 630 },
  { name: "Helvetia", premium: 4350, saving: 480 },
  { name: "AXA", premium: 4480, saving: 350 },
  { name: "Mobiliar", premium: 4520, saving: 310 },
];

const savingsByPolicy = [
  { policy: "Salute complementare", saving: 420, impact: "medium" as const },
  { policy: "Mobilia domestica", saving: 280, impact: "high" as const },
  { policy: "RC Auto", saving: 120, impact: "low" as const },
  { policy: "Protezione giuridica", saving: 60, impact: "low" as const },
];

export default function MarketPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Confronto mercato"
        description="Benchmark indicativi rispetto a profili simili in Svizzera."
        meta={
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <IconClock className="h-3.5 w-3.5" />
            Dati aggiornati al {dashboardStats.marketUpdated}
          </span>
        }
      />

      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-900">
        Le stime sono indicative e basate su dati aggregati anonimi. Atlas non vende polizze né agisce come broker.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sopra media mercato"
          value={formatCHF(1240)}
          subtext="sopra la media di mercato"
          variant="red"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Posizionamento"
          value="Sopra la media"
          subtext="Percentile 72°"
          variant="yellow"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Risparmio stimato"
          value={`${formatCHF(1240)} / anno`}
          subtext="-26% rispetto alla media"
          variant="green"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Polizze analizzate"
          value="6 su 6"
          subtext="attive"
          variant="blue"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard title="Confronto premi" action={<LinkAction href="/policies">Dettagli</LinkAction>}>
            <div className="space-y-4">
              {benchmarks.map((bm) => {
                const cat = catMap[bm.category] ?? "car";
                const diff = bm.userPremium - bm.marketMedian;
                const userW = Math.min(100, (bm.userPremium / bm.marketRange[1]) * 100);
                const marketW = Math.min(100, (bm.marketMedian / bm.marketRange[1]) * 100);
                return (
                  <div key={bm.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", categoryIconBg[cat])}>
                        <PolicyCategoryIcon category={cat} className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-[12px] font-medium text-slate-800">{bm.label}</span>
                      <span className="text-[11px] text-slate-500">{formatCHF(bm.userPremium)}</span>
                      <span className="text-[11px] text-slate-400">vs {formatCHF(bm.marketMedian)}</span>
                      {diff > 0 && (
                        <span className="text-[11px] font-medium text-red-600">+{formatCHF(diff)}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${userW}%` }} />
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${marketW}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Posizionamento sul mercato">
            <div className="text-center">
              <p className="text-3xl font-semibold text-amber-600">72°</p>
              <p className="text-[11px] text-slate-500">percentile</p>
            </div>
            <div className="mt-4 flex h-16 items-end justify-center gap-0.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 rounded-t",
                    i === 8 ? "bg-amber-400 h-14" : "bg-slate-200 h-8"
                  )}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Risparmio stimato">
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCHF(dashboardStats.potentialSavings.min)}
              <span className="text-[13px] font-normal text-slate-500"> / anno</span>
            </p>
            <dl className="mt-4 space-y-2 text-[11px]">
              <div className="flex justify-between"><dt className="text-slate-500">Minimo</dt><dd className="font-medium">CHF 840</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Medio</dt><dd className="font-medium">CHF 1&apos;240</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Massimo</dt><dd className="font-medium">CHF 1&apos;560</dd></div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Compagnie alternative" padding="none">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400">
                <th className="px-5 py-2 text-left">Compagnia</th>
                <th className="px-3 py-2 text-left">Premio medio</th>
                <th className="px-3 py-2 text-left">Risparmio</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {alternatives.map((a) => (
                <tr key={a.name} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-3 py-3 text-slate-600">{formatCHF(a.premium)}</td>
                  <td className="px-3 py-3 font-medium text-emerald-600">-{formatCHF(a.saving)}</td>
                  <td className="px-3 py-3"><LinkAction href="/market">Dettagli</LinkAction></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Risparmio per polizza">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400">
                <th className="pb-2 text-left">Polizza</th>
                <th className="pb-2 text-left">Risparmio</th>
                <th className="pb-2 text-left">Impatto</th>
              </tr>
            </thead>
            <tbody>
              {savingsByPolicy.map((row) => (
                <tr key={row.policy} className="border-b border-slate-50">
                  <td className="py-2.5 text-slate-800">{row.policy}</td>
                  <td className="py-2.5 font-medium text-emerald-600">{formatCHF(row.saving)}</td>
                  <td className="py-2.5">
                    <StatusBadge
                      variant={row.impact === "high" ? "critical" : row.impact === "medium" ? "attention" : "ok"}
                      label={row.impact === "high" ? "Alto" : row.impact === "medium" ? "Medio" : "Basso"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      <SectionCard title="Simulatore scenari">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-medium text-slate-600">Livello copertura</label>
            <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]">
              <option>Standard (attuale)</option>
              <option>Ridotto</option>
              <option>Premium</option>
            </select>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-[11px] text-slate-600">Risparmio stimato</p>
            <p className="text-xl font-semibold text-emerald-700">{formatCHF(890)} / anno</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] font-medium text-slate-800">
          Vuoi un&apos;analisi personalizzata del tuo posizionamento?
        </p>
        <div className="flex gap-2">
          <Link
            href="/market"
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            Vedi confronto completo
          </Link>
          <Link
            href="/consulting"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700"
          >
            Richiedi consulenza
          </Link>
        </div>
      </div>
    </div>
  );
}
