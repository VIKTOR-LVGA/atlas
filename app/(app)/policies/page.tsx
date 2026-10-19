import Link from "next/link";
import { FilePlus2, Plus } from "lucide-react";
import { EmptyState } from "@/components/consumer/EmptyState";
import { PolicyConsumerCard } from "@/components/policies/PolicyConsumerCard";
import { getCurrentUserPolicies } from "@/lib/policies";
import { groupPoliciesByVisualCategory } from "@/lib/policy-visual-categories";

export const metadata = { title: "Le mie polizze" };

export default async function PoliciesPage() {
  const policies = await getCurrentUserPolicies();
  const groups = groupPoliciesByVisualCategory(policies);

  return (
    <div className="space-y-6">
      <header className="atlas-consumer-hero flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0">
          <p className="atlas-premium-eyebrow">Il tuo portafoglio</p>
          <h1 className="atlas-premium-title mt-2">Le mie polizze</h1>
          <p className="mt-1 text-[13px] text-muted">
            Scopri quanto paghi e cosa prevede ogni polizza.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/documents" className="atlas-btn-primary min-h-12 w-full px-5 text-[13px] sm:w-auto">
            <FilePlus2 className="h-4 w-4" aria-hidden/> Carica un PDF
          </Link>
          <Link href="/policies/new" className="atlas-btn-secondary min-h-12 w-full px-5 text-[13px] sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden/> Inserisci a mano
          </Link>
        </div>
      </header>

      {policies.length === 0 ? (
        <EmptyState
          title="Non hai ancora aggiunto polizze"
          description="Parti da un PDF: ATLAS prepara una bozza da controllare, senza inventare dati mancanti."
          actionLabel="Carica una polizza PDF"
          actionHref="/documents"
          secondaryLabel="Inserisci a mano"
          secondaryHref="/policies/new"
        />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.category.id}>
              <h2 className="mb-4 text-[18px] font-bold tracking-[-.025em] text-foreground">
                {group.category.label}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.policies.map((policy) => (
                  <PolicyConsumerCard key={policy.id} policy={policy} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
