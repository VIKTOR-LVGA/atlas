import { IconAnalysis } from "@/components/icons";
import { PremiumOnboardingEmpty } from "@/components/onboarding/PremiumOnboardingEmpty";
import type { PortfolioProgression } from "@/lib/portfolio-progression";

type AnalysisEmptyPortfolioProps = {
  progression?: PortfolioProgression;
};

export function AnalysisEmptyPortfolio({
  progression,
}: AnalysisEmptyPortfolioProps) {
  return (
    <PremiumOnboardingEmpty
      icon={<IconAnalysis className="h-7 w-7" />}
      title="Centro analisi in attesa di dati"
      description="Carica PDF assicurativi, avvia l'estrazione AI e conferma le bozze per attivare l'intelligence sul portafoglio."
      actionLabel="Carica un PDF"
      actionHref="/documents"
      secondaryActionLabel="Crea polizza manuale"
      secondaryActionHref="/policies/new"
      progression={progression}
      steps={[
        {
          step: "1",
          title: "Upload",
          text: "Archivia i PDF nel workspace privato.",
        },
        {
          step: "2",
          title: "Estrazione",
          text: "OCR e strutturazione automatica dei campi.",
        },
        {
          step: "3",
          title: "Conferma",
          text: "Rivedi le bozze per sbloccare gli insight.",
        },
      ]}
    />
  );
}
