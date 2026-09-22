import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligencePremiums,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";

export const metadata = { title: "Premi | ATLAS Intelligence" };

export default async function IntelligencePremiumsPage() {
  const [summary, rows] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligencePremiums().catch(() => []),
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
        <h1 className="text-[24px] font-semibold tracking-tight">Premi</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Distribuzione premi annualizzati (mediana, P25, P75) sul campione idoneo ATLAS.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Solo CHF annualizzati affidabili. Min/max non
          esposti. Denominatore = osservazioni idonee, non registrazioni totali.
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
          columns={["Categoria", "Compagnia", "N", "Mediana", "P25", "P75"]}
          rows={usable.map((row) => [
            row.category,
            row.insurer ?? "Tutte",
            String(row.source_count ?? "—"),
            row.median_premium != null ? `CHF ${row.median_premium}` : "—",
            row.p25_premium != null ? String(row.p25_premium) : "—",
            row.p75_premium != null ? String(row.p75_premium) : "—",
          ])}
          empty={null}
        />
      )}
    </>
  );
}
