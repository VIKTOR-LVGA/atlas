import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import { SwitzerlandChoropleth } from "@/components/maps/SwitzerlandChoropleth";
import {
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligenceDashboardSummary,
  getIntelligenceGeography,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Geografia | ATLAS Intelligence" };

export default async function IntelligenceGeographyPage() {
  const [summary, rows] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceGeography().catch(() => []),
  ]);
  const usable = rows.filter((r) => r.sample_status === "ok");
  const minK = summary.minimum_cohort_size ?? INTELLIGENCE_MIN_COHORT;
  const period =
    summary.period_start && summary.period_end
      ? `${summary.period_start} → ${summary.period_end}`
      : null;

  const mapData = rows.map((row) => ({
    canton: row.canton,
    policies: row.sample_status === "ok" ? Number(row.observed_policies ?? 0) : 0,
    privacyMasked: row.sample_status !== "ok",
  }));

  return (
    <>
      <header className="mb-4 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Geografia</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Risoluzione cantone sul campione ATLAS. Nessun indirizzo o CAP esatto.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Cantoni sotto soglia: campione
          insufficiente (nessun valore metrico).
        </IntelligenceMethodNote>
      </header>
      <IntelligenceContextBar period={period} lastUpdated={summary.last_updated} />

      <div className="mb-6">
        <SwitzerlandChoropleth
          data={mapData}
          metric="policies"
          title="Polizze osservate (campione ATLAS)"
          metrics={["policies"]}
          showAtlasShare={false}
          showRanking={false}
        />
      </div>

      {!usable.length ? (
        <IntelligenceEmptyState
          title="Campione ancora insufficiente"
          description={insufficientSampleLabel(minK)}
        />
      ) : (
        <IntelligenceDataTable
          columns={["Cantone", "Categoria", "Polizze", "Premio mediano", "Switch"]}
          rows={usable.map((row) => [
            cantonLabel(row.canton) || row.canton,
            row.category,
            String(row.observed_policies ?? "—"),
            row.median_premium != null ? String(row.median_premium) : "—",
            String(row.switch_count ?? "—"),
          ])}
          empty={null}
        />
      )}
    </>
  );
}
