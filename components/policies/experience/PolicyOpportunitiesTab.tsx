import Link from "next/link";
import type { IntelligenceOpportunityCard } from "@/lib/opportunities-intelligence/build";
import { opportunityMaturityLabels } from "@/lib/opportunities-intelligence/foundation";

export function PolicyOpportunitiesTab({
  cards,
}: {
  cards: IntelligenceOpportunityCard[];
}) {
  const actionable = cards.filter((c) => c.section !== "analyzing");
  const analyzing = cards.filter((c) => c.section === "analyzing");

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-6">
        <p className="text-[14px] font-medium text-foreground">
          Al momento non abbiamo trovato interventi prioritari.
        </p>
        <ul className="mt-3 space-y-1.5 text-[12px] text-muted">
          <li>✓ Nessuna scadenza imminente su questa polizza</li>
          <li>✓ Nessun dato critico segnalato qui</li>
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Il confronto prezzi sarà disponibile quando ATLAS dispone di un campione
          sufficientemente comparabile. Non mostriamo stime CHF senza evidenza.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionable.map((card) => (
        <article
          key={card.id}
          className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
            {opportunityMaturityLabels[card.evidence.maturity]}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-foreground">{card.title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{card.description}</p>
          {card.impactLabel ? (
            <p className="mt-2 text-[12px] text-muted">{card.impactLabel}</p>
          ) : null}
          <Link
            href={card.ctaHref}
            className="mt-3 inline-flex text-[13px] font-medium text-accent hover:underline"
          >
            {card.ctaLabel}
          </Link>
        </article>
      ))}

      {analyzing.map((card) => (
        <article
          key={card.id}
          className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-4 sm:px-5"
        >
          <h3 className="text-[14px] font-semibold text-foreground">{card.title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{card.description}</p>
        </article>
      ))}

      <p className="text-[11px] text-muted">
        Nessun risparmio inventato. I benchmark attivano stime solo con campione e
        similarità sufficienti.
      </p>
    </div>
  );
}
