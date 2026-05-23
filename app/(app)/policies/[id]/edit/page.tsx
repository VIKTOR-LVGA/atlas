import { notFound } from "next/navigation";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { WarningPanel } from "@/components/ui/WarningPanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getCurrentUserPolicyById } from "@/lib/policies";

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

  return (
    <PageShell
      backHref={`/policies/${policy.id}`}
      backLabel="Torna al dettaglio"
    >
      <PageHeader
        title={`Modifica ${policy.provider}`}
        description={
          policy.requiresReview
            ? "Conferma o correggi i campi estratti dall'AI prima di salvare."
            : "Aggiorna i dati della polizza e il PDF collegato."
        }
      />

      {policy.requiresReview ? (
        <WarningPanel
          title="Bozza AI in revisione"
          items={[
            "Verifica premio, franchigia e persone assicurate.",
            "Salva la scheda quando i dati corrispondono al PDF.",
          ]}
        />
      ) : null}

      <SectionCard title="Dati polizza" padding="md">
        <PolicyForm documents={documents} policy={policy} />
      </SectionCard>
    </PageShell>
  );
}
