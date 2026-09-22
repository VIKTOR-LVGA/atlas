import {
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  insufficientSampleLabel,
  requireIntelligenceAccess,
} from "@/lib/intelligence-access";

export const metadata = { title: "Switching | ATLAS Intelligence" };

export default async function IntelligenceSwitchingPage() {
  await requireIntelligenceAccess();
  return (
    <>
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Switching</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Vista aggregata privacy-safe sul campione osservato da ATLAS.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} k≥{INTELLIGENCE_MIN_COHORT}.
        </IntelligenceMethodNote>
      </header>
      <IntelligenceEmptyState
        title="Campione insufficiente"
        description={insufficientSampleLabel()}
      />
    </>
  );
}
