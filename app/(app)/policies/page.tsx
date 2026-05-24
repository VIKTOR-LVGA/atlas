import { ClipboardCheck, Plus, Sparkles } from "lucide-react";
import { PolicyPortfolioWorkspace } from "@/components/policies/PolicyPortfolioWorkspace";
import { IconPolicies } from "@/components/icons";
import { PremiumOnboardingEmpty } from "@/components/onboarding/PremiumOnboardingEmpty";
import { PortfolioProgressionPanel } from "@/components/onboarding/PortfolioProgressionPanel";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { atlasKpiRow } from "@/lib/atlas-ui";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getPortfolioProgression } from "@/lib/portfolio-progression";

export const metadata = { title: "Polizze" };

export default async function PoliciesPage() {
  const [policies, progression] = await Promise.all([
    getCurrentUserPolicies(),
    getPortfolioProgression(),
  ]);
  const pendingReview = policies.filter((policy) => policy.requiresReview);
  const aiDrafts = policies.filter((policy) => policy.source === "ai_draft");
  const confirmedAiDrafts = aiDrafts.filter((policy) => !policy.requiresReview);

  return (
    <PageShell>
      <RevealStagger>
      <PageHeader
        title="Le mie polizze"
        description="Portafoglio assicurativo strutturato dai tuoi PDF e dalle schede confermate."
        action={
          <PrimaryButton href="/policies/new" icon={<Plus className="h-4 w-4" />}>
            Nuova polizza
          </PrimaryButton>
        }
      />

      <div className={atlasKpiRow}>
        <MetricCard
          label="Totale polizze"
          value={String(policies.length)}
          subtext="Nel portafoglio"
          variant="indigo"
          icon={<IconPolicies className="h-4 w-4" />}
        />
        <MetricCard
          label="Da rivedere"
          value={String(pendingReview.length)}
          subtext="Bozze AI in coda"
          variant={pendingReview.length > 0 ? "yellow" : "green"}
          icon={<ClipboardCheck className="h-4 w-4" />}
          badge={
            pendingReview.length > 0 ? (
              <StatusBadge variant="attention" label="Azione" />
            ) : undefined
          }
        />
        <MetricCard
          label="Bozze AI"
          value={String(aiDrafts.length)}
          subtext={
            confirmedAiDrafts.length > 0
              ? `${confirmedAiDrafts.length} confermate`
              : "Estratte da PDF"
          }
          variant="blue"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Manuali"
          value={String(policies.length - aiDrafts.length)}
          subtext="Create a mano"
          variant="purple"
          icon={<IconPolicies className="h-4 w-4" />}
        />
      </div>

      {pendingReview.length > 0 ? (
        <ReviewBanner
          title={`${pendingReview.length} bozza${pendingReview.length === 1 ? "" : "e"} da confermare`}
          description="L'estrazione AI ha precompilato i campi principali. Apri ogni scheda e verifica i dati critici."
          editHref={`/policies/${pendingReview[0].id}/edit`}
          uncertainCount={pendingReview.length}
          className="atlas-action-strip border-0"
        />
      ) : null}

      {policies.length === 0 ? (
        <>
          <PortfolioProgressionPanel progression={progression} compact />
          <PremiumOnboardingEmpty
            icon={<IconPolicies className="h-7 w-7" />}
            title="Carica la tua prima polizza"
            description="Atlas costruirà progressivamente il tuo ecosistema assicurativo: PDF, estrazione AI e scheda strutturata."
            actionLabel="Vai ai documenti"
            actionHref="/documents"
            secondaryActionLabel="Crea manualmente"
            secondaryActionHref="/policies/new"
            progression={progression}
            steps={[
              {
                step: "1",
                title: "PDF",
                text: "Carica polizza, condizioni o attestato.",
              },
              {
                step: "2",
                title: "Bozza AI",
                text: "Rivedi premio, persone e coperture estratte.",
              },
              {
                step: "3",
                title: "Conferma",
                text: "Sblocca alert e raccomandazioni verificate.",
              },
            ]}
          />
        </>
      ) : (
        <>
          {progression.showOnboardingFocus ? (
            <PortfolioProgressionPanel progression={progression} compact />
          ) : null}
          <PolicyPortfolioWorkspace policies={policies} />
        </>
      )}
      </RevealStagger>
    </PageShell>
  );
}
