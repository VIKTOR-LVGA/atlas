import Link from "next/link";
import { ClipboardCheck, Sparkles } from "lucide-react";
import type { PortfolioProgression } from "@/lib/portfolio-progression";
import { ModuleUnlockGrid } from "@/components/onboarding/ModuleUnlockGrid";
import { PortfolioCompletenessGrid } from "@/components/onboarding/PortfolioCompletenessGrid";
import { atlasCard } from "@/lib/atlas-ui";

type AnalysisUnlockGuidanceProps = {
  progression: PortfolioProgression;
};

export function AnalysisUnlockGuidance({
  progression,
}: AnalysisUnlockGuidanceProps) {
  const next = progression.nextStep;

  return (
    <div className="atlas-stack-section">
      <div className={`${atlasCard.primary} p-6 sm:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="atlas-section-eyebrow text-accent">Analisi in preparazione</p>
            <h2 className="mt-1 text-[17px] font-semibold text-foreground">
              Conferma le bozze AI per sbloccare insight avanzati
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Atlas ha già strutturato dati dal tuo portafoglio. L&apos;intelligence
              diagnostica (health score, mappa rischi, trend) si attiva solo su polizze
              verificate per sbloccare analisi e raccomandazioni.
            </p>
            <ul className="mt-4 space-y-2 text-[12px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Estrazione completata sui documenti analizzati
              </li>
              <li className="flex items-start gap-2">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                In attesa di conferma: {progression.completeness.find((m) => m.id === "policies-confirmed")?.detail}
              </li>
            </ul>
          </div>
          {next ? (
            <Link
              href={next.ctaHref ?? "/policies"}
              className="atlas-btn-primary shrink-0 px-5 py-2.5 text-[13px]"
            >
              {next.ctaLabel ?? "Rivedi bozza"}
            </Link>
          ) : null}
        </div>
      </div>

      <PortfolioCompletenessGrid metrics={progression.completeness} />
      <ModuleUnlockGrid unlocks={progression.unlocks} />
    </div>
  );
}
