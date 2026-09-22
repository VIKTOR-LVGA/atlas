import { getPolicyCoverages } from "@/lib/policy-types";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getPolicyDeadlineDate } from "@/lib/policy-schedule";
import type { UserDocument, UserPolicy } from "@/lib/types";
import {
  type OpportunityEvidence,
  type OpportunityIntelligenceKind,
  type OpportunityMaturityLevel,
  canShowSavingsEstimate,
} from "@/lib/opportunities-intelligence/foundation";

export type IntelligenceOpportunityCard = {
  id: string;
  kind: OpportunityIntelligenceKind;
  title: string;
  description: string;
  section: "evaluate" | "monitor" | "analyzing" | "consulting";
  ctaLabel: string;
  ctaHref: string;
  evidence: OpportunityEvidence;
  /** Never populate with invented CHF amounts. */
  impactLabel: string | null;
};

function baseEvidence(
  kind: OpportunityIntelligenceKind,
  maturity: OpportunityMaturityLevel
): OpportunityEvidence {
  return {
    maturity,
    kind,
    sampleSize: null,
    similarityBand: null,
    coverageComparable: null,
    dataComplete: maturity >= 1,
    freshnessDate: null,
    comparisonBasis: null,
    estimatedImpactRangeChf: null,
    isRealQuote: false,
  };
}

/**
 * Level-1 opportunities (account/document) + coverage-gap signals from extracted exclusions.
 * Does NOT emit savings estimates without benchmark evidence.
 */
export function buildIntelligenceOpportunities(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  now?: Date;
}): IntelligenceOpportunityCard[] {
  const now = input.now ?? new Date();
  const cards: IntelligenceOpportunityCard[] = [];

  for (const policy of input.policies) {
    const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);
    const deadline = getPolicyDeadlineDate(policy);

    if (deadline) {
      const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntil = Math.round(
        (deadline.timestamp - startOfToday) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil >= 0 && daysUntil <= 60) {
        cards.push({
          id: `expiration-${policy.id}`,
          kind: "expiration",
          title: `${typeLabel} in scadenza`,
          description:
            daysUntil === 0
              ? `${typeLabel} scade oggi.`
              : `${typeLabel} scade tra ${daysUntil} giorni.`,
          section: "monitor",
          ctaLabel: "Apri polizza",
          ctaHref: `/policies/${policy.id}?view=overview`,
          evidence: baseEvidence("expiration", 1),
          impactLabel: null,
        });
      }
    }

    if (policy.premiumAmount === null) {
      cards.push({
        id: `missing-premium-${policy.id}`,
        kind: "missing_data",
        title: "Premio da completare",
        description: `Manca il premio su ${typeLabel}.`,
        section: "evaluate",
        ctaLabel: "Verifica dati",
        ctaHref: `/policies/${policy.id}?view=review`,
        evidence: baseEvidence("missing_data", 1),
        impactLabel: null,
      });
    }

    if (!policy.documentId) {
      cards.push({
        id: `missing-doc-${policy.id}`,
        kind: "document_followup",
        title: "Documento mancante",
        description: `Carica il PDF di ${typeLabel} per completare l'analisi.`,
        section: "evaluate",
        ctaLabel: "Apri polizza",
        ctaHref: `/policies/${policy.id}?view=document`,
        evidence: baseEvidence("document_followup", 1),
        impactLabel: null,
      });
    }

    if (policy.requiresReview) {
      cards.push({
        id: `broker-review-${policy.id}`,
        kind: "broker_review",
        title: "Dati da verificare",
        description: `${typeLabel} ha campi da confermare prima di usarli come definitivi.`,
        section: "evaluate",
        ctaLabel: "Verifica dati",
        ctaHref: `/policies/${policy.id}?view=review`,
        evidence: baseEvidence("broker_review", 1),
        impactLabel: null,
      });
    }

    const coverages = getPolicyCoverages(policy.details);
    const excluded = coverages.filter((c) => c.coverage_status === "excluded");
    const notable = excluded
      .map((c) => c.name)
      .filter(Boolean)
      .slice(0, 3);
    if (notable.length > 0 && (policy.policyType === "car" || /auto|vehicle/i.test(typeLabel))) {
      cards.push({
        id: `coverage-gap-${policy.id}`,
        kind: "coverage_gap",
        title: "Coperture non incluse",
        description: `Nel contratto risultano non incluse: ${notable.join(", ")}.`,
        section: "evaluate",
        ctaLabel: "Vedi coperture",
        ctaHref: `/policies/${policy.id}?view=coverages`,
        evidence: {
          ...baseEvidence("coverage_gap", 1),
          coverageComparable: false,
          comparisonBasis: "Estratto dal PDF — non è un confronto di mercato.",
        },
        impactLabel: null,
      });
    }

    // Placeholder analyzing card only when motor policy has enough structure but no cohort yet
    if (
      policy.policyType === "car" &&
      policy.premiumAmount !== null &&
      coverages.length >= 3
    ) {
      const analyzingEvidence = baseEvidence("savings_potential", 0);
      cards.push({
        id: `analyzing-benchmark-${policy.id}`,
        kind: "savings_potential",
        title: "Confronto prezzi in costruzione",
        description:
          "Il confronto prezzi sarà disponibile quando ATLAS dispone di un campione sufficientemente comparabile. Nessuna stima CHF viene mostrata senza evidenza.",
        section: "analyzing",
        ctaLabel: "Apri polizza",
        ctaHref: `/policies/${policy.id}?view=opportunities`,
        evidence: analyzingEvidence,
        impactLabel: canShowSavingsEstimate(analyzingEvidence)
          ? null
          : "Confronto non ancora sufficientemente affidabile",
      });
    }
  }

  return cards;
}

export function groupIntelligenceOpportunities(
  cards: IntelligenceOpportunityCard[]
) {
  return {
    evaluate: cards.filter((c) => c.section === "evaluate"),
    monitor: cards.filter((c) => c.section === "monitor"),
    analyzing: cards.filter((c) => c.section === "analyzing"),
    consulting: cards.filter((c) => c.section === "consulting"),
  };
}
