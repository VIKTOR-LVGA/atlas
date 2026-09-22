import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligenceInsurers,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";

export const metadata = { title: "Compagnie | ATLAS Intelligence" };

export default async function IntelligenceInsurersPage() {
  const [summary, rows] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceInsurers().catch(() => []),
  ]);
  const usable = rows.filter((r) => r.sample_status === "ok");
  const minK = summary.minimum_cohort_size ?? INTELLIGENCE_MIN_COHORT;
  const period =
    summary.period_start && summary.period_end
      ? `${summary.period_start} → ${summary.period_end}`
      : null;

  return (
    <>
      <header className="mb-4 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Compagnie</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Posizione osservata nel campione ATLAS. Nessuna classifica best/worst insurer.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Quota = quota osservata nel campione ATLAS. Net
          switching = inflow − outflow osservati.
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
          columns={[
            "Compagnia",
            "Categoria",
            "Polizze",
            "Premio med.",
            "Inflow",
            "Outflow",
            "Net",
          ]}
          rows={usable.map((row) => [
            row.insurer,
            row.category,
            String(row.observed_policies ?? "—"),
            row.median_premium != null ? String(row.median_premium) : "—",
            String(row.switch_inflow ?? "—"),
            String(row.switch_outflow ?? "—"),
            String(row.net_observed_switching ?? "—"),
          ])}
          empty={null}
        />
      )}
    </>
  );
}
