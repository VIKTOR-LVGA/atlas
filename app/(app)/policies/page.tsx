import { Plus } from "lucide-react";
import { PolicyListCard } from "@/components/policies/PolicyListCard";
import { IconPolicies } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, PrimaryButton } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { ReviewBanner } from "@/components/ui/ReviewBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Polizze" };

export default async function PoliciesPage() {
  const policies = await getCurrentUserPolicies();
  const pendingReview = policies.filter((policy) => policy.requiresReview);\n  const verifiedCount=policies.length-pendingReview.length;

  return (
    <PageShell>
      <PageHeader
        title="Le tue polizze"
        description="Tutte le tue assicurazioni, in un unico posto."
        action={
          <PrimaryButton href="/policies/new" icon={<Plus className="h-4 w-4" />}>
            Nuova polizza
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl border border-[#e5eaf3] bg-white p-4"><p className="text-[11px] text-[#687a99]">Totale</p><p className="mt-1 text-2xl font-extrabold text-[#101e3c]">{policies.length}</p></div><div className="rounded-2xl border border-[#e5eaf3] bg-white p-4"><p className="text-[11px] text-[#687a99]">Verificate</p><p className="mt-1 text-2xl font-extrabold text-[#101e3c]">{verifiedCount}</p></div><div className="rounded-2xl border border-[#e5eaf3] bg-white p-4"><p className="text-[11px] text-[#687a99]">Da rivedere</p><p className="mt-1 text-2xl font-extrabold text-[#101e3c]">{pendingReview.length}</p></div></div><div className="flex justify-end"><a href="/market" className="text-[12px] font-bold text-[#3157eb]">Confronta il mercato →</a></div>
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
          title="Le tue assicurazioni"
          description="Apri una scheda per vedere coperture, premio, documenti e stato di verifica."
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
