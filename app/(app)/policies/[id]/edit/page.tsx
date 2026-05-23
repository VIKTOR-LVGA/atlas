import { notFound } from "next/navigation";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserDocuments } from "@/lib/documents";
import { healthReviewStateFromGroupedView } from "@/lib/health-policy-review";
import {
  getHealthPolicyGroupedView,
  hasHealthPolicyDetailData,
} from "@/lib/policy-health-grouping";
import { getCurrentUserPolicyById } from "@/lib/policies";
import {
  getPolicyExtractionMetadata,
  getPolicyFieldConfidenceRows,
} from "@/lib/policy-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Modifica polizza" };

export default async function EditPolicyPage({ params }: PageProps) {
  const { id } = await params;
  const [policy, documents] = await Promise.all([
    getCurrentUserPolicyById(id),
    getCurrentUserDocuments(),
  ]);

  if (!policy) {
    notFound();
  }

  const extractionMetadata = getPolicyExtractionMetadata(policy.details);
  const fieldConfidenceRows = getPolicyFieldConfidenceRows(policy.details);
  const uncertainFields = fieldConfidenceRows.filter((row) => row.uncertain);

  const healthGrouped =
    policy.policyType === "health" && hasHealthPolicyDetailData(policy.details)
      ? getHealthPolicyGroupedView(policy.details, policy.premiumAmount, policy.id)
      : null;

  const healthReviewState = healthGrouped
    ? healthReviewStateFromGroupedView(healthGrouped)
    : null;

  const reviewWarnings = [
    ...(healthGrouped?.ownershipWarnings ?? []),
    ...(extractionMetadata.warnings ?? []),
  ]
    .filter(
      (warning) =>
        !warning.includes("Poche keyword") &&
        !warning.includes("Numero polizza non rilevato")
    )
    .slice(0, 8);

  return (
    <PageShell
      backHref={`/policies/${policy.id}`}
      backLabel="Torna al dettaglio"
    >
      <PageHeader
        title={
          policy.requiresReview
            ? `Revisione bozza — ${policy.provider}`
            : `Modifica ${policy.provider}`
        }
        description={
          policy.requiresReview
            ? "Conferma o correggi i campi estratti dall'AI, incluse persone e coperture, prima di confermare la polizza."
            : "Aggiorna i dati della polizza e la struttura delle coperture."
        }
      />

      {policy.requiresReview ? (
        <WarningPanel
          title="Bozza AI in revisione"
          items={[
            "Verifica premio, persone assicurate e coperture assegnate.",
            "Usa «Salva modifiche» per proseguire la revisione.",
            "Usa «Conferma polizza» solo quando i dati corrispondono al PDF.",
          ]}
        />
      ) : null}

      {uncertainFields.length > 0 ? (
        <WarningPanel
          title="Campi da verificare"
          items={[
            `${uncertainFields.length} campi con confidenza bassa nell'estrazione.`,
            "Controlla i valori evidenziati prima di confermare.",
          ]}
        />
      ) : null}

      <SectionCard title="Scheda polizza" padding="md">
        <PolicyForm
          documents={documents}
          policy={policy}
          healthReviewState={healthReviewState}
          healthReviewWarnings={reviewWarnings}
        />
      </SectionCard>
    </PageShell>
  );
}
