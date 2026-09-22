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

function annualizePremium(
  amount: number | null | undefined,
  frequency: string | null | undefined
): number | null {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const n = Number(amount);
  const f = (frequency ?? "annual").toLowerCase();
  if (f === "monthly") return n * 12;
  if (f === "quarterly") return n * 4;
  if (f === "semiannual" || f === "semi_annual") return n * 2;
  if (f === "annual" || f === "yearly") return n;
  return null;
}

/**
 * Level-1 opportunities (account/document) + coverage-gap signals from extracted exclusions.
 * Does NOT emit savings estimates without benchmark evidence.
 */
export function buildIntelligenceOpportunities(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  now?: Date;
  verifiedQuotes?: Array<{
    id: string;
    consultation_request_id: string;
    source_policy_id: string | null;
    insurer: string;
    product: string;
    premium_amount: number | string | null;
    premium_frequency: string | null;
    currency: string | null;
  }>;
}): IntelligenceOpportunityCard[] {
  const now = input.now ?? new Date();
  const cards: IntelligenceOpportunityCard[] = [];

  for (const quote of input.verifiedQuotes ?? []) {
    if (!quote.source_policy_id) continue;
    const policy = input.policies.find((p) => p.id === quote.source_policy_id);
    if (!policy) continue;
    const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);
    const offerAnnual = annualizePremium(
      quote.premium_amount != null ? Number(quote.premium_amount) : null,
      quote.premium_frequency
    );
    const currentAnnual = annualizePremium(
      policy.premiumAmount,
      policy.premiumFrequency
    );
    let impact: string | null = null;
    if (offerAnnual != null && currentAnnual != null) {
      const delta = offerAnnual - currentAnnual;
      const abs = Math.abs(delta).toLocaleString("it-CH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      impact =
        delta < 0
          ? `Differenza: − CHF ${abs} / anno`
          : delta > 0
            ? `Differenza: + CHF ${abs} / anno`
            : `Premio invariato`;
    }
    cards.push({
      id: `verified-quote-${quote.id}`,
      kind: "lower_cost_same_coverage",
      title: "Preventivo verificato disponibile",
      description: `${quote.insurer} · ${quote.product} per ${typeLabel}. Preventivo reale del broker, non una stima ATLAS.`,
      section: "evaluate",
      ctaLabel: "Confronta preventivo",
      ctaHref: `/consultations/${quote.consultation_request_id}/offers/${quote.id}`,
      evidence: {
        ...baseEvidence("lower_cost_same_coverage", 4),
        isRealQuote: true,
        dataComplete: true,
        comparisonBasis: "verified_broker_quote",
        freshnessDate: now.toISOString().slice(0, 10),
        estimatedImpactRangeChf:
          offerAnnual != null && currentAnnual != null
            ? {
                min: Math.round((offerAnnual - currentAnnual) * 100) / 100,
                max: Math.round((offerAnnual - currentAnnual) * 100) / 100,
              }
            : null,
      },
      impactLabel: impact
        ? `Nuovo premio: ${quote.currency ?? "CHF"} ${
            offerAnnual != null
              ? offerAnnual.toLocaleString("it-CH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"
          } / anno · ${impact}`
        : "Preventivo verificato — apri il confronto",
    });
  }

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
