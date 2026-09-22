import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligenceMarketOverview,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";

export const metadata = { title: "Market | ATLAS Intelligence" };

export default async function IntelligenceMarketPage() {
  const [summary, market] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceMarketOverview().catch(() => []),
  ]);
  const usable = market.filter((r) => r.sample_status === "ok");
  const minK = summary.minimum_cohort_size ?? INTELLIGENCE_MIN_COHORT;
  const period =
    summary.period_start && summary.period_end
      ? `${summary.period_start} → ${summary.period_end}`
      : null;

  return (
    <>
      <header className="mb-4 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Mercato</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Distribuzione categorie, compagnie e premi sul campione osservato da ATLAS.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Quota = quota osservata nel campione ATLAS.
        </IntelligenceMethodNote>
      </header>
      <IntelligenceContextBar period={period} lastUpdated={summary.last_updated} />
      {!usable.length ? (
        <IntelligenceEmptyState
          title="Campione ancora insufficiente"
          description={insufficientSampleLabel(minK)}
        />
      ) : (
        <IntelligenceDataTable
          columns={["Categoria", "Compagnia", "N idonee", "Mediana CHF", "P25", "P75"]}
          rows={usable.map((row) => [
            row.category,
            "—",
            String(row.observed_policies ?? "—"),
            row.median_premium != null ? String(row.median_premium) : "—",
            row.p25_premium != null ? String(row.p25_premium) : "—",
            row.p75_premium != null ? String(row.p75_premium) : "—",
          ])}
          empty={null}
        />
      )}
    </>
  );
}
