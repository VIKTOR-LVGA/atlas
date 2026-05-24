import { ClipboardCheck, Plus, Sparkles } from "lucide-react";
import { PolicyPortfolioWorkspace } from "@/components/policies/PolicyPortfolioWorkspace";
import { IconPolicies } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RevealStagger } from "@/components/motion/RevealStagger";
import { atlasKpiRow } from "@/lib/atlas-ui";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Polizze" };

export default async function PoliciesPage() {
  const policies = await getCurrentUserPolicies();
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

      {policies.length > 0 ? (
        <PolicyPortfolioWorkspace policies={policies} />
      ) : (
        <div className="atlas-surface-card p-6">
          <EmptyState
            icon={<IconPolicies className="h-6 w-6" />}
            title="Nessuna polizza ancora"
            description="Carica un PDF assicurativo e avvia l'analisi, oppure crea una scheda manuale."
            actionLabel="Vai ai documenti"
            actionHref="/documents"
            secondaryActionLabel="Crea manualmente"
            secondaryActionHref="/policies/new"
          />
        </div>
      )}
      </RevealStagger>
    </PageShell>
  );
}
