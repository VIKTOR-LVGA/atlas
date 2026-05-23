import { Plus } from "lucide-react";
import { PolicyListCard } from "@/components/policies/PolicyListCard";
import { IconPolicies } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Polizze" };

export default async function PoliciesPage() {
  const policies = await getCurrentUserPolicies();
  const pendingReview = policies.filter((policy) => policy.requiresReview);
  const aiDrafts = policies.filter((policy) => policy.source === "ai_draft");
  const confirmedAiDrafts = aiDrafts.filter((policy) => !policy.requiresReview);

  return (
    <PageShell>
      <PageHeader
        title="Le mie polizze"
        description="Schede strutturate dai tuoi PDF e creazione manuale."
        action={
          <PrimaryButton href="/policies/new" icon={<Plus className="h-4 w-4" />}>
            Nuova polizza
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Totale polizze"
          value={String(policies.length)}
          subtext="Nel tuo archivio"
          variant="blue"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Da rivedere"
          value={String(pendingReview.length)}
          subtext="Bozze AI"
          variant="yellow"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
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
          variant="indigo"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
        <MetricCard
          label="Manuali"
          value={String(policies.length - aiDrafts.length)}
          subtext="Create a mano"
          variant="green"
          icon={<IconPolicies className="h-[18px] w-[18px]" />}
        />
      </div>

      {pendingReview.length > 0 ? (
        <ReviewBanner
          title={`${pendingReview.length} bozza${pendingReview.length === 1 ? "" : "e"} da confermare`}
          description="L'estrazione AI ha precompilato i campi principali. Apri ogni scheda e verifica i dati critici."
          editHref={`/policies/${pendingReview[0].id}/edit`}
          uncertainCount={pendingReview.length}
        />
      ) : null}

      {policies.length > 0 ? (
        <SectionCard
          title="Archivio"
          description="Tutte le polizze collegate ai tuoi documenti."
          padding="none"
        >
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {policies.map((policy) => (
              <PolicyListCard key={policy.id} policy={policy} />
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Archivio polizze">
          <EmptyState
            icon={<IconPolicies className="h-6 w-6" />}
            title="Nessuna polizza ancora"
            description="Carica un PDF assicurativo e avvia l'analisi, oppure crea una scheda manuale."
            actionLabel="Vai ai documenti"
            actionHref="/documents"
            secondaryActionLabel="Crea manualmente"
            secondaryActionHref="/policies/new"
          />
        </SectionCard>
      )}
    </PageShell>
  );
}
