import {
  IntelligenceEmptyState,
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  INTELLIGENCE_MIN_COHORT,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  requireIntelligenceAccess,
} from "@/lib/intelligence-access";

export const metadata = { title: "Report | ATLAS Intelligence" };

export default async function IntelligenceReportsPage() {
  await requireIntelligenceAccess();

  return (
    <>
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Report</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Foundation reportistica: viste salvate e export CSV aggregati (stesse regole privacy
          della UI). Nessun export di righe grezze.
        </p>
        <IntelligenceMethodNote>
          {INTELLIGENCE_REPRESENTATIVENESS_NOTE} Export sopprime celle sotto k≥
          {INTELLIGENCE_MIN_COHORT}.
        </IntelligenceMethodNote>
      </header>
      <IntelligenceEmptyState
        title="Nessun report salvato"
        description="Quando il campione ATLAS sarà sufficiente, potrai salvare viste analitiche e scaricare CSV aggregati privacy-safe. Nessun dato individuale sarà mai esportabile."
      />
    </>
  );
}
