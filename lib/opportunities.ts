import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getPolicyDeadlineDate } from "@/lib/policy-schedule";
import type { UserDocument, UserPolicy } from "@/lib/types";

export type OpportunityKind =
  | "expiring"
  | "missing_premium"
  | "missing_document"
  | "stale_review";

export type Opportunity = {
  id: string;
  kind: OpportunityKind;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

const STALE_AFTER_DAYS = 180;
const EXPIRING_WITHIN_DAYS = 60;

function daysSince(iso: string, now: Date) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24));
}

export function buildOpportunities(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  now?: Date;
}): Opportunity[] {
  const now = input.now ?? new Date();
  const opportunities: Opportunity[] = [];

  for (const policy of input.policies) {
    const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);
    const deadline = getPolicyDeadlineDate(policy);

    if (deadline) {
      const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntil = Math.round(
        (deadline.timestamp - startOfToday) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil >= 0 && daysUntil <= EXPIRING_WITHIN_DAYS) {
        opportunities.push({
          id: `expiring-${policy.id}`,
          kind: "expiring",
          title: `${typeLabel} in scadenza`,
          description:
            daysUntil === 0
              ? `${typeLabel} scade oggi. Controlla i dati della polizza.`
              : `${typeLabel} scade tra ${daysUntil} giorn${daysUntil === 1 ? "o" : "i"}.`,
          ctaLabel: "Controlla polizza",
          ctaHref: `/policies/${policy.id}`,
        });
      }
    }

    if (policy.premiumAmount === null) {
      opportunities.push({
        id: `premium-${policy.id}`,
        kind: "missing_premium",
        title: "Premio mancante",
        description: `Non hai ancora indicato il premio di ${typeLabel}.`,
        ctaLabel: "Controlla polizza",
        ctaHref: `/policies/${policy.id}/edit`,
      });
    }

    if (!policy.documentId) {
      opportunities.push({
        id: `document-${policy.id}`,
        kind: "missing_document",
        title: "Documento mancante",
        description: `Non hai caricato il documento principale di ${typeLabel}.`,
        ctaLabel: "Controlla polizza",
        ctaHref: `/policies/${policy.id}`,
      });
    }

    const age = daysSince(policy.updatedAt, now);
    if (age !== null && age >= STALE_AFTER_DAYS) {
      opportunities.push({
        id: `stale-${policy.id}`,
        kind: "stale_review",
        title: "Revisione periodica",
        description: `${typeLabel} non è stata aggiornata da ${Math.floor(age / 30)} mesi.`,
        ctaLabel: "Controlla polizza",
        ctaHref: `/policies/${policy.id}`,
      });
    }
  }

  if (input.policies.length === 0) {
    opportunities.push({
      id: "empty-portfolio",
      kind: "missing_premium",
      title: "Nessuna polizza nel portafoglio",
      description: "Aggiungi la prima assicurazione per vedere scadenze, premi e documenti.",
      ctaLabel: "Aggiungi polizza",
      ctaHref: "/policies/new",
    });
  }

  const order: Record<OpportunityKind, number> = {
    expiring: 0,
    missing_document: 1,
    missing_premium: 2,
    stale_review: 3,
  };

  return opportunities.sort((a, b) => order[a.kind] - order[b.kind]);
}
