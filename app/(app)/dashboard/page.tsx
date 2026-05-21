import Link from "next/link";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertItem } from "@/components/ui/AlertItem";
import { CTABox } from "@/components/ui/CTABox";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconCar,
  IconShield,
  IconAlert,
  IconPiggy,
  IconChevronRight,
} from "@/components/icons";
import { alerts, dashboardStats, policies } from "@/lib/mock-data";
import { categoryIconBg, PolicyCategoryIcon } from "@/lib/policy-ui";
import { formatCHF, cn } from "@/lib/utils";
import type { PolicyHealthStatus } from "@/lib/types";

export const metadata = { title: "Dashboard" };

const healthToBadge: Record<PolicyHealthStatus, "ok" | "attention" | "critical"> = {
  ok: "ok",
  attention: "attention",
  critical: "critical",
};

export default function DashboardPage() {
  const tablePolicies = policies.slice(0, 6);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ciao Marco!"
        description="Ecco l'analisi delle tue assicurazioni in sintesi."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton icon={<span className="text-slate-400">↻</span>}>
              Aggiorna analisi
            </SecondaryButton>
            <PrimaryButton href="/documents" icon={<span className="text-lg leading-none">+</span>}>
              Carica nuova polizza
            </PrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Premio totale annuo"
          value={formatCHF(dashboardStats.annualPremium)}
          subtext={`${dashboardStats.activePolicies} polizze attive`}
          variant="blue"
          icon={<IconCar className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Punteggio copertura"
          value={`${dashboardStats.coverageHealthScore}%`}
          subtext="Buon livello complessivo"
          variant="green"
          icon={<IconShield className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Alert attivi"
          value={String(dashboardStats.alertsCount)}
          subtext="Vedi dettagli"
          subtextLink="link"
          variant="yellow"
          icon={<IconAlert className="h-[18px] w-[18px]" />}
        />
        <StatCard
          label="Risparmio potenziale"
          value={formatCHF(dashboardStats.potentialSavings.min)}
          subtext={`-${dashboardStats.savingsPercent}% del premio attuale`}
          variant="purple"
          icon={<IconPiggy className="h-[18px] w-[18px]" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Le tue polizze"
            action={<LinkAction href="/policies">Vedi tutte</LinkAction>}
            padding="none"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5">Polizza</th>
                    <th className="px-3 py-2.5">Compagnia</th>
                    <th className="px-3 py-2.5">Premio annuo</th>
                    <th className="px-3 py-2.5">Stato</th>
                    <th className="w-8 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {tablePolicies.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3">
                        <Link href={`/policies/${p.id}`} className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              categoryIconBg[p.category]
                            )}
                          >
                            <PolicyCategoryIcon category={p.category} />
                          </span>
                          <span className="font-medium text-slate-900">{p.name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{p.insurer}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {formatCHF(p.annualPremium)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge variant={healthToBadge[p.healthStatus]} />
                      </td>
                      <td className="px-3 py-3">
                        <IconChevronRight className="h-4 w-4 text-slate-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-50 py-3 text-center">
              <LinkAction href="/policies">
                Vedi tutte le polizze ({dashboardStats.activePolicies})
              </LinkAction>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Alert e criticità"
          action={<LinkAction href="/analysis">Vedi tutte</LinkAction>}
          padding="sm"
        >
          <div className="divide-y divide-slate-50">
            {alerts.slice(0, 4).map((a) => (
              <AlertItem
                key={a.id}
                title={a.title}
                description={a.description}
                severity={a.severity}
                href="/analysis"
                icon={<IconAlert className="h-4 w-4" />}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Confronto mercato"
            action={<LinkAction href="/market">Vedi dettagli</LinkAction>}
          >
            <p className="text-[12px] text-slate-600">
              I tuoi premi sono sopra la media di mercato per profili simili in Ticino.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>Il tuo premio attuale</span>
                  <span className="font-medium text-slate-800">
                    {formatCHF(dashboardStats.annualPremium)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[85%] rounded-full bg-blue-500" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>Media mercato</span>
                  <span className="font-medium text-slate-800">
                    {formatCHF(dashboardStats.annualPremium - dashboardStats.potentialSavings.min)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[62%] rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-right text-[13px] font-semibold text-emerald-600">
              Risparmio potenziale {formatCHF(dashboardStats.potentialSavings.min)} (
              {dashboardStats.savingsPercent}%)
            </p>
          </SectionCard>
        </div>

        <CTABox
          title="Vuoi un'analisi approfondita?"
          description="Un consulente indipendente rivede il tuo portafoglio e ti guida nelle decisioni."
          checklist={[
            "Analisi personalizzata del portafoglio",
            "Piano d'azione prioritario",
            "Supporto nella negoziazione",
          ]}
          buttonLabel="Richiedi consulenza (da CHF 290)"
          buttonHref="/consulting"
        />
      </div>

      <CTABox
        variant="banner"
        title="Atlas è indipendente: non vendiamo polizze né riceviamo commissioni da assicuratori."
        buttonLabel=""
      />
    </div>
  );
}
