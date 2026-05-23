import type { PolicyDocumentExtractionResult } from "@/lib/document-analysis";
import type {
  PolicyDetails,
  PolicyExtractionMetadata,
  PolicyFieldConfidenceKey,
  PolicyFieldConfidenceMap,
} from "@/lib/types";
import {
  detectDocumentLanguages,
  getInferredSectionsFromText,
  getSwissInsuranceKeywords,
  inferSwissExtractionWarnings,
  normalizeSwissInsuranceProvider,
  normalizeSwissPolicyClassification,
} from "@/lib/swiss-insurance-normalization";

function getPayloadRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function clampConfidence(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function upsertFieldConfidence(
  map: PolicyFieldConfidenceMap,
  key: PolicyFieldConfidenceKey,
  value: string | number | boolean | null,
  confidence: number | null,
  evidence: string | null,
  uncertain?: boolean
) {
  const resolvedConfidence = clampConfidence(confidence);
  const isUncertain =
    uncertain ?? (resolvedConfidence !== null && resolvedConfidence < 75);

  map[key] = {
    value,
    confidence: resolvedConfidence,
    uncertain: isUncertain,
    evidence,
  };
}

function averageConfidence(map: PolicyFieldConfidenceMap) {
  const values = Object.values(map)
    .map((item) => item?.confidence)
    .filter((value): value is number => value !== null && value !== undefined);

  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function enrichExtractionMetadata(
  draft: PolicyDocumentExtractionResult["draft"],
  extractedText: string,
  fileName: string
): PolicyExtractionMetadata {
  const details = getPayloadRecord(draft.details);
  const existing = getPayloadRecord(details.extraction_metadata);
  const providerMatch = normalizeSwissInsuranceProvider(
    draft.provider,
    `${fileName}\n${extractedText.slice(0, 8000)}`
  );

  const matchedKeywords = [
    ...getSwissInsuranceKeywords(extractedText),
    ...((Array.isArray(existing.matched_keywords)
      ? existing.matched_keywords
      : []) as string[]),
  ];
  const inferredSections = [
    ...getInferredSectionsFromText(extractedText),
    ...((Array.isArray(existing.inferred_sections)
      ? existing.inferred_sections
      : []) as string[]),
  ];
  const providerAliases = [
    providerMatch.matchedAlias,
    ...((Array.isArray(existing.provider_aliases_matched)
      ? existing.provider_aliases_matched
      : []) as string[]),
  ].filter((value): value is string => Boolean(value));

  const warnings = inferSwissExtractionWarnings({
    draft,
    extractedText,
    matchedKeywords,
    providerMatched: Boolean(providerMatch.matchedAlias),
  });

  const existingWarnings = Array.isArray(existing.warnings)
    ? (existing.warnings as string[])
    : [];

  return {
    matched_keywords: [...new Set([...matchedKeywords, ...providerAliases])].slice(0, 32),
    inferred_sections: [...new Set(inferredSections)].slice(0, 12),
    warnings: [...new Set([...existingWarnings, ...warnings])].slice(0, 12),
    provider_raw:
      typeof existing.provider_raw === "string"
        ? existing.provider_raw
        : draft.provider,
    normalized_provider: providerMatch.provider ?? draft.provider,
    provider_aliases_matched: [...new Set(providerAliases)].slice(0, 8),
    detected_languages: detectDocumentLanguages(extractedText),
    source_hints: [
      `filename:${fileName}`,
      `text_length:${extractedText.length}`,
      ...(Array.isArray(existing.source_hints)
        ? (existing.source_hints as string[])
        : []),
    ].slice(0, 8),
  };
}

function enrichFieldConfidenceMap(
  draft: PolicyDocumentExtractionResult["draft"],
  providerConfidence: number | null,
  providerAlias: string | null
): PolicyFieldConfidenceMap {
  const details = getPayloadRecord(draft.details);
  const existing = getPayloadRecord(details.field_confidence) as PolicyFieldConfidenceMap;
  const map: PolicyFieldConfidenceMap = { ...existing };

  upsertFieldConfidence(
    map,
    "provider",
    draft.provider,
    providerConfidence,
    providerAlias ?? `provider:${draft.provider}`
  );
  upsertFieldConfidence(
    map,
    "policy_type",
    draft.policyType,
    map.policy_type?.confidence ?? 82,
    `policy_type:${draft.policyType}`
  );
  upsertFieldConfidence(
    map,
    "policy_number",
    draft.policyNumber,
    draft.policyNumber ? map.policy_number?.confidence ?? 78 : 35,
    draft.policyNumber ? "policy_number present" : "policy_number missing"
  );
  upsertFieldConfidence(
    map,
    "premium_amount",
    draft.premiumAmount,
    draft.premiumAmount === null ? 40 : map.premium_amount?.confidence ?? 80,
    draft.premiumAmount === null ? "premium not found" : "premium extracted"
  );
  upsertFieldConfidence(
    map,
    "premium_frequency",
    draft.premiumFrequency,
    map.premium_frequency?.confidence ?? 85,
    `frequency:${draft.premiumFrequency}`
  );
  upsertFieldConfidence(
    map,
    "deductible",
    draft.deductible,
    draft.deductible === null ? 45 : map.deductible?.confidence ?? 78,
    draft.deductible === null ? "deductible missing" : "deductible extracted"
  );
  upsertFieldConfidence(
    map,
    "start_date",
    draft.startDate,
    draft.startDate ? map.start_date?.confidence ?? 72 : 40,
    draft.startDate ?? "start_date missing"
  );
  upsertFieldConfidence(
    map,
    "end_date",
    draft.endDate,
    draft.endDate ? map.end_date?.confidence ?? 72 : 40,
    draft.endDate ?? "end_date missing"
  );
  upsertFieldConfidence(
    map,
    "renewal_date",
    draft.renewalDate,
    draft.renewalDate ? map.renewal_date?.confidence ?? 70 : 38,
    draft.renewalDate ?? "renewal_date missing"
  );
  upsertFieldConfidence(
    map,
    "currency",
    draft.currency,
    map.currency?.confidence ?? 90,
    `currency:${draft.currency}`
  );
  upsertFieldConfidence(
    map,
    "coverage_amount",
    draft.coverageAmount,
    draft.coverageAmount === null ? 42 : map.coverage_amount?.confidence ?? 75,
    draft.coverageAmount === null ? "coverage_amount missing" : "coverage_amount extracted"
  );
  upsertFieldConfidence(map, "details", "structured", map.details?.confidence ?? 74, "details json");

  return map;
}

/**
 * Post-processes an OpenAI draft with Swiss-specific metadata and field confidence.
 */
export function enrichSwissPolicyExtraction(
  result: PolicyDocumentExtractionResult,
  document: { fileName: string },
  extractedText: string
): PolicyDocumentExtractionResult {
  const classification = normalizeSwissPolicyClassification(
    result.draft.policyCategoryLabel ?? result.draft.policyType,
    `${document.fileName}\n${extractedText.slice(0, 6000)}`
  );
  const providerMatch = normalizeSwissInsuranceProvider(
    result.draft.provider,
    `${document.fileName}\n${extractedText.slice(0, 5000)}`
  );

  const details = { ...result.draft.details } as PolicyDetails;
  const fieldConfidence = enrichFieldConfidenceMap(
    result.draft,
    providerMatch.confidence,
    providerMatch.matchedAlias
  );
  const extractionMetadata = enrichExtractionMetadata(
    result.draft,
    extractedText,
    document.fileName
  );

  const enrichedDetails: PolicyDetails = {
    ...details,
    coverage_kind:
      details.coverage_kind ??
      (classification.subtype !== "other" ? classification.subtype : null),
    field_confidence: fieldConfidence,
    extraction_metadata: extractionMetadata,
  };

  const overallConfidence =
    result.draft.extractionConfidence ??
    averageConfidence(fieldConfidence);

  const uncertainCount = Object.values(fieldConfidence).filter(
    (item) => item?.uncertain
  ).length;

  const extractionNotes =
    result.draft.extractionNotes ??
    [
      "Estrazione OpenAI con normalizzazione svizzera.",
      uncertainCount > 0
        ? `${uncertainCount} campi richiedono verifica manuale.`
        : "Campi principali coerenti con il documento.",
    ].join(" ");

  return {
    ...result,
    draft: {
      ...result.draft,
      provider: providerMatch.provider ?? result.draft.provider,
      policyType:
        result.draft.policyType === "other" && classification.policyType !== "other"
          ? classification.policyType
          : result.draft.policyType,
      policyCategoryLabel:
        result.draft.policyCategoryLabel ??
        (classification.subtype === "other" ? null : classification.categoryLabel),
      details: enrichedDetails,
      extractionConfidence: overallConfidence,
      extractionNotes,
    },
  };
}
