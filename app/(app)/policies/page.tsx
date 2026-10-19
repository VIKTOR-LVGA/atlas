import Link from "next/link";
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
      <header className="atlas-consumer-hero flex flex-col gap-4 rounded-3xl border border-border p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Le mie polizze</h1>
          <p className="mt-1 text-[13px] text-muted">
            Scopri quanto paghi e cosa prevede ogni polizza.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/documents" className="atlas-btn-primary min-h-11 w-full px-4 text-[13px] sm:w-auto">
            Carica un PDF
          </Link>
          <Link href="/policies/new" className="atlas-btn-secondary min-h-11 w-full px-4 text-[13px] sm:w-auto">
            Inserisci a mano
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
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                {group.category.label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
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
