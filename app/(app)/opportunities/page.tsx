import Link from "next/link";
import { ConsultationPrepCard } from "@/components/consumer/ConsultationPrepCard";
import { OpportunityActions } from "@/components/consumer/OpportunityActions";
import { listCurrentUserConsultationRequests } from "@/lib/consultations";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getCurrentUserPolicies } from "@/lib/policies";
import { syncCurrentUserOpportunities } from "@/lib/persisted-opportunities";
import {
  buildIntelligenceOpportunities,
  groupIntelligenceOpportunities,
} from "@/lib/opportunities-intelligence/build";
import { opportunityMaturityLabels } from "@/lib/opportunities-intelligence/foundation";

export const metadata = { title: "Opportunità" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[12px] text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function OpportunitiesPage() {
  const [policies, documents, consultationRequests] = await Promise.all([
    getCurrentUserPolicies(),
    getCurrentUserDocuments(),
    listCurrentUserConsultationRequests(),
  ]);
  const persisted = await syncCurrentUserOpportunities({ policies, documents });
  const intelligence = buildIntelligenceOpportunities({ policies, documents });
  const grouped = groupIntelligenceOpportunities(intelligence);
  const activeConsultation =
    consultationRequests.find(
      (request) => !["won", "lost", "completed", "cancelled"].includes(request.status)
    ) ?? null;

  const hasActionable =
    grouped.evaluate.length > 0 ||
    grouped.monitor.length > 0 ||
    persisted.length > 0;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Opportunità
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          ATLAS analizza le tue polizze e segnala dove vale la pena guardare più da
          vicino. Nessuna stima di risparmio senza evidenza statistica o preventivo
          reale.
        </p>
      </header>

      {!hasActionable ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-6">
          <p className="text-[15px] font-semibold text-foreground">
            Al momento non abbiamo trovato interventi prioritari.
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
            <li>✓ Polizze analizzate nel portafoglio</li>
            <li>✓ Nessuna scadenza imminente</li>
            <li>✓ Nessun dato critico mancante</li>
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            Il confronto prezzi sarà disponibile quando ATLAS dispone di un campione
            sufficientemente comparabile.
          </p>
          <Link
            href="/policies"
            className="mt-4 inline-flex text-[13px] font-medium text-accent hover:underline"
          >
            Vai alle polizze
          </Link>
        </div>
      ) : null}

      {grouped.evaluate.length > 0 ? (
        <Section title="Da valutare" description="Gap, dati mancanti, revisioni">
          <ul className="space-y-3">
            {grouped.evaluate.map((item) => (
              <li key={item.id} className="atlas-consumer-card px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {opportunityMaturityLabels[item.evidence.maturity]}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {item.description}
                </p>
                <Link
                  href={item.ctaHref}
                  className="mt-3 inline-flex text-[13px] font-medium text-accent"
                >
                  {item.ctaLabel}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {grouped.monitor.length > 0 || persisted.length > 0 ? (
        <Section title="Monitoraggio" description="Scadenze e promemoria account">
          <ul className="space-y-3">
            {grouped.monitor.map((item) => (
              <li key={item.id} className="atlas-consumer-card px-5 py-4">
                <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[13px] text-muted">{item.description}</p>
                <Link
                  href={item.ctaHref}
                  className="mt-3 inline-flex text-[13px] font-medium text-accent"
                >
                  {item.ctaLabel}
                </Link>
              </li>
            ))}
            {persisted.map((item) => (
              <li key={item.id} className="atlas-consumer-card px-5 py-4">
                <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[13px] text-muted">{item.description}</p>
                <Link
                  href={
                    typeof item.metadata.cta_href === "string"
                      ? item.metadata.cta_href
                      : "/policies"
                  }
                  className="mt-3 inline-flex text-[13px] font-medium text-accent"
                >
                  {typeof item.metadata.cta_label === "string"
                    ? item.metadata.cta_label
                    : "Controlla dati"}
                </Link>
                <OpportunityActions id={item.id} seen={item.status === "seen"} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {grouped.analyzing.length > 0 ? (
        <Section
          title="In analisi"
          description="Benchmark in costruzione — nessuna stima CHF"
        >
          <ul className="space-y-3">
            {grouped.analyzing.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-dashed border-border px-5 py-4"
              >
                <p className="text-[14px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Consulenza">
        <ConsultationPrepCard request={activeConsultation} />
      </Section>
    </div>
  );
}
