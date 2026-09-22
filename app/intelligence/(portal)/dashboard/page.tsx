import {
  IntelligenceContextBar,
  IntelligenceEmptyState,
  IntelligenceKpi,
  IntelligenceMethodNote,
  IntelligenceDataTable,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligenceMarketOverview,
  getIntelligenceSwitchingMatrix,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";
import { eligibleCountLabel } from "@/lib/intelligence/privacy";
import { OperationsPanel } from "@/components/operations/OperationsUi";

export const metadata = { title: "Intelligence Dashboard | ATLAS" };

export default async function IntelligenceDashboardPage() {
  const [summary, market, switching] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceMarketOverview().catch(() => []),
    getIntelligenceSwitchingMatrix().catch(() => []),
  ]);

  const usableMarket = market.filter((row) => row.sample_status === "ok");
  const usableSwitch = switching.filter((row) => row.sample_status === "ok");
  const minK = summary.minimum_cohort_size ?? INTELLIGENCE_MIN_COHORT;
  const period =
    summary.period_start && summary.period_end
      ? `${summary.period_start} → ${summary.period_end}`
      : null;

  const hasAny = usableMarket.length > 0 || usableSwitch.length > 0;

  return (
    <>
      <header className="mb-4 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] text-muted">
          Movimento osservato nel campione ATLAS — solo aggregati privacy-safe.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Soglia minima coorte: {minK}.
        </IntelligenceMethodNote>
      </header>

      <IntelligenceContextBar
        sampleLabel={summary.sample_label ?? "Campione ATLAS"}
        period={period}
        lastUpdated={summary.last_updated}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IntelligenceKpi
          label="Polizze idonee (premio)"
          value={eligibleCountLabel(summary.policies_eligible, minK)}
          detail="Solo osservazioni validate CHF"
        />
        <IntelligenceKpi
          label="Switch confermati"
          value={eligibleCountLabel(summary.switches_eligible, minK)}
          detail="Eventi confermati, non stime"
        />
        <IntelligenceKpi
          label="Serie mercato utilizzabili"
          value={String(summary.market_series_ok ?? usableMarket.length)}
          detail={`k≥${minK}`}
        />
        <IntelligenceKpi
          label="Celle switching utilizzabili"
          value={String(summary.switching_cells_ok ?? usableSwitch.length)}
          detail="Matrice origine → destinazione"
        />
      </div>

      {!hasAny ? (
        <IntelligenceEmptyState
          title="Campione ancora insufficiente"
          description={insufficientSampleLabel(minK)}
          meta={`Metodologia ${summary.methodology_version ?? "atlas-intelligence-v1"} · nessun dato grezzo esposto`}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <OperationsPanel title="Market overview">
            <IntelligenceDataTable
              columns={["Categoria", "N", "Mediana", "P25", "P75"]}
              rows={usableMarket.slice(0, 12).map((row) => [
                `${row.category}${row.canton ? ` · ${row.canton}` : ""}`,
                String(row.observed_policies ?? "—"),
                row.median_premium != null ? String(row.median_premium) : "—",
                row.p25_premium != null ? String(row.p25_premium) : "—",
                row.p75_premium != null ? String(row.p75_premium) : "—",
              ])}
              empty={<p className="text-[12px] text-muted">{insufficientSampleLabel(minK)}</p>}
            />
          </OperationsPanel>
          <OperationsPanel title="Switching osservato">
            <IntelligenceDataTable
              columns={["Da", "A", "N"]}
              rows={usableSwitch.slice(0, 12).map((row) => [
                row.from_insurer,
                row.to_insurer,
                String(row.switch_count ?? "—"),
              ])}
              empty={<p className="text-[12px] text-muted">{insufficientSampleLabel(minK)}</p>}
            />
          </OperationsPanel>
        </div>
      )}
    </>
  );
}
