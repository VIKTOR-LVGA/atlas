import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <div className="space-y-5">
      <Link
        href={`/policies/${policy.id}`}
        className="text-[12px] text-slate-500 hover:text-slate-700"
      >
        Torna al dettaglio polizza
      </Link>

      <PageHeader
        title={`Modifica ${policy.provider}`}
        description="Aggiorna i dati inseriti manualmente e il PDF collegato."
      />

      <SectionCard title="Dati polizza" padding="md">
        <PolicyForm documents={documents} policy={policy} />
      </SectionCard>
    </div>
  );
}
