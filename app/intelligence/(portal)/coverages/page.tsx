import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceCoverages,
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";

export const metadata = { title: "Coperture | ATLAS Intelligence" };

export default async function IntelligenceCoveragesPage() {
  const [summary, rows] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceCoverages().catch(() => []),
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
        <h1 className="text-[24px] font-semibold tracking-tight">Coperture</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Penetrazione coperture sul campione ATLAS. Unknown resta unknown — non conteggiato come
          escluso.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Denominatore = polizze con status copertura noto
          (included/excluded).
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
          columns={["Categoria", "Copertura", "Penetrazione", "N noti"]}
          rows={usable.map((row) => [
            row.category,
            row.coverage_code,
            row.penetration_pct != null ? `${row.penetration_pct}%` : "—",
            String(row.source_count ?? "—"),
          ])}
          empty={null}
        />
      )}
    </>
  );
}
