import Link from "next/link";
import { ConsultationPrepCard } from "@/components/consumer/ConsultationPrepCard";
import { EmptyState } from "@/components/consumer/EmptyState";
import { getCurrentUserDocuments } from "@/lib/documents";
import { buildOpportunities } from "@/lib/opportunities";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Opportunità" };

export default async function OpportunitiesPage() {
  const [policies, documents] = await Promise.all([
    getCurrentUserPolicies(),
    getCurrentUserDocuments(),
  ]);
  const opportunities = buildOpportunities({ policies, documents });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Opportunità</h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
          Promemoria sui dati del tuo account: scadenze, campi mancanti e documenti da
          completare. Non è una raccomandazione assicurativa.
        </p>
      </header>

      {opportunities.length === 0 ? (
        <EmptyState
          title="Nessuna opportunità al momento"
          description="Quando una polizza scade o mancano dati, li vedrai qui."
          actionLabel="Vai alle polizze"
          actionHref="/policies"
        />
      ) : (
        <ul className="space-y-3">
          {opportunities.map((item) => (
            <li key={item.id} className="atlas-consumer-card px-5 py-4">
              <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.description}</p>
              <Link
                href={item.ctaHref}
                className="mt-4 inline-flex min-h-10 items-center text-[13px] font-medium text-accent"
              >
                {item.ctaLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ConsultationPrepCard />
    </div>
  );
}
