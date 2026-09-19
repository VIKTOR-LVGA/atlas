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
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Le mie polizze</h1>
          <p className="mt-1 text-[13px] text-muted">
            Tutte le assicurazioni, organizzate per tipo.
          </p>
        </div>
        <Link href="/policies/new" className="atlas-btn-primary min-h-11 px-4 text-[13px]">
          Aggiungi
        </Link>
      </header>

      {policies.length === 0 ? (
        <EmptyState
          title="Nessuna polizza ancora"
          description="Aggiungi la prima assicurazione per vedere premi, scadenze e documenti."
          actionLabel="Aggiungi polizza"
          actionHref="/policies/new"
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
