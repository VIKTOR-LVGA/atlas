import {
  IntelligenceContextBar,
  IntelligenceDataTable,
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  getIntelligenceDashboardSummary,
  EMPTY_INTELLIGENCE_SUMMARY,
  getIntelligenceSwitchingMatrix,
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
} from "@/lib/intelligence-access";

export const metadata = { title: "Switching | ATLAS Intelligence" };

export default async function IntelligenceSwitchingPage() {
  const [summary, matrix] = await Promise.all([
    getIntelligenceDashboardSummary().catch(() => EMPTY_INTELLIGENCE_SUMMARY),
    getIntelligenceSwitchingMatrix().catch(() => []),
  ]);
  const usable = matrix.filter((r) => r.sample_status === "ok");
  const suppressed = matrix.filter((r) => r.sample_status !== "ok").length;
  const minK = summary.minimum_cohort_size ?? INTELLIGENCE_MIN_COHORT;
  const period =
    summary.period_start && summary.period_end
      ? `${summary.period_start} → ${summary.period_end}`
      : null;

  return (
    <>
      <header className="mb-4 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Switching</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Flussi compagnia → compagnia nel campione ATLAS. Celle sotto soglia privacy
          soppresse.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Solo switch confermati (contratto /
          dichiarazione). Net observed switching ≠ acquisizione di mercato svizzera.
        </IntelligenceMethodNote>
      </header>
      <IntelligenceContextBar period={period} lastUpdated={summary.last_updated} />
      {!usable.length ? (
        <IntelligenceEmptyState
          title="Campione ancora insufficiente"
          description={insufficientSampleLabel(minK)}
          meta={
            suppressed > 0
              ? `${suppressed} celle matrice presenti ma sotto soglia — valori non esposti.`
              : undefined
          }
        />
      ) : (
        <IntelligenceDataTable
          columns={["Da (outflow)", "A (inflow)", "N osservati"]}
          rows={usable.map((row) => [
            row.from_insurer,
            row.to_insurer,
            String(row.switch_count ?? "—"),
          ])}
          empty={null}
        />
      )}
    </>
  );
}
