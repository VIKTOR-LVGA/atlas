import { canonicalCoverageTaxonomy } from "@/lib/insurance-knowledge/coverage-taxonomy";
import { normalizeKnowledgeText } from "@/lib/insurance-knowledge/document-types";
import { recognizeSwissInsurer } from "@/lib/insurance-knowledge/insurer-registry";

export type CoverageNormalization = {
  canonicalType: string | null;
  category: string | null;
  originalLabel: string;
  confidence: number;
  matchedAlias: string | null;
};

export function normalizeCoverageLabel(label: string): CoverageNormalization {
  const normalized = normalizeKnowledgeText(label);
  let best:
    | { canonicalType: string; category: string; alias: string; score: number }
    | undefined;

  for (const definition of canonicalCoverageTaxonomy) {
    for (const alias of Object.values(definition.aliases).flat()) {
      const candidate = normalizeKnowledgeText(alias);
      const exact = normalized === candidate;
      const included = normalized.includes(candidate) || candidate.includes(normalized);
      if (!included) continue;

      const score = exact ? 1000 + candidate.length : candidate.length;
      if (!best || score > best.score) {
        best = {
          canonicalType: definition.canonicalType,
          category: definition.category,
          alias,
          score,
        };
      }
    }
  }

  return {
    canonicalType: best?.canonicalType ?? null,
    category: best?.category ?? null,
    originalLabel: label.trim(),
    confidence: best ? (best.score >= 1000 ? 99 : 84) : 0,
    matchedAlias: best?.alias ?? null,
  };
}

export function normalizeInsurerLabel(label: string, documentText = "") {
  return recognizeSwissInsurer(`${label}\n${documentText}`);
}

export function annualizePremium(amount: number | null, frequency: string | null) {
  if (amount === null || !Number.isFinite(amount) || amount < 0) return null;
  const multiplier: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    semiannual: 2,
    annual: 1,
  };
  const factor = frequency ? multiplier[frequency] : undefined;
  return factor ? Math.round(amount * factor * 100) / 100 : null;
}

export function canPersistAsPersonalPolicy(documentType: string) {
  return documentType === "policy" || documentType === "coverage_summary";
}
