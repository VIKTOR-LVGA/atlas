import {
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceMarketOverview,
  getIntelligenceSwitchingMatrix,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";
import { OperationsMetric, OperationsPanel } from "@/components/operations/OperationsUi";

export const metadata = { title: "Intelligence Dashboard | ATLAS" };

export default async function IntelligenceDashboardPage() {
  const [market, switching] = await Promise.all([
    getIntelligenceMarketOverview().catch(() => []),
    getIntelligenceSwitchingMatrix().catch(() => []),
  ]);

  const usableMarket = market.filter((row) => row.sample_status === "ok");
  const usableSwitch = switching.filter((row) => row.sample_status === "ok");

  return (
    <>
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] text-muted">
          Cosa sta accadendo nel mercato osservato da ATLAS — solo aggregati privacy-safe.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Soglia minima coorte: {INTELLIGENCE_MIN_COHORT}.
        </IntelligenceMethodNote>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric
          label="Serie mercato utilizzabili"
          value={String(usableMarket.length)}
          detail={`${market.length} snapshot totali`}
        />
        <OperationsMetric
          label="Flussi switching utilizzabili"
          value={String(usableSwitch.length)}
          detail={`${switching.length} celle totali`}
        />
        <OperationsMetric
          label="Soglia privacy"
          value={`k≥${INTELLIGENCE_MIN_COHORT}`}
        />
        <OperationsMetric label="Dati grezzi PII" value="0" detail="Mai esposti" />
      </div>

      {!usableMarket.length && !usableSwitch.length ? (
        <IntelligenceEmptyState
          title="Campione insufficiente"
          description={insufficientSampleLabel()}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <OperationsPanel title="Market overview">
            {!usableMarket.length ? (
              <p className="text-[12px] text-muted">{insufficientSampleLabel()}</p>
            ) : (
              <ul className="space-y-2 text-[12px]">
                {usableMarket.slice(0, 8).map((row, index) => (
                  <li
                    key={`${row.category}-${row.canton}-${index}`}
                    className="flex justify-between gap-3 border-b border-border py-2"
                  >
                    <span>
                      {row.category}
                      {row.canton ? ` · ${row.canton}` : ""}
                    </span>
                    <span className="tabular-nums text-muted">
                      n={row.observed_policies ?? "—"} · med{" "}
                      {row.median_premium ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </OperationsPanel>
          <OperationsPanel title="Switching (aggregato)">
            {!usableSwitch.length ? (
              <p className="text-[12px] text-muted">{insufficientSampleLabel()}</p>
            ) : (
              <ul className="space-y-2 text-[12px]">
                {usableSwitch.slice(0, 8).map((row, index) => (
                  <li
                    key={`${row.from_insurer}-${row.to_insurer}-${index}`}
                    className="flex justify-between gap-3 border-b border-border py-2"
                  >
                    <span>
                      {row.from_insurer} → {row.to_insurer}
                    </span>
                    <span className="tabular-nums text-muted">
                      {row.switch_count ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </OperationsPanel>
        </div>
      )}
    </>
  );
}
