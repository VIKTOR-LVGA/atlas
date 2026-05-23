import "server-only";

import { downloadCurrentUserDocumentFile } from "@/lib/documents";
import { extractReadableTextFromPdf } from "@/lib/pdf-text";
import {
  getInternalFailureReason,
  logPolicyAnalysisError,
  logPolicyAnalysisInfo,
} from "@/lib/policy-analysis-logging";
import {
  isTypedPolicyType,
  sanitizePolicyDetails,
  typedPolicyTypes,
} from "@/lib/policy-types";
import { enrichSwissPolicyExtraction } from "@/lib/swiss-extraction-enrichment";
import {
  getSwissInsuranceKeywords,
  isSwissPolicySubtype,
  normalizeSwissInsuranceProvider,
  normalizeSwissPolicyClassification,
  swissPolicySubtypes,
} from "@/lib/swiss-insurance-normalization";
import type { PolicyFieldConfidenceKey } from "@/lib/types";
import type {
  PolicyDetails,
  PolicyPremiumFrequency,
  TypedPolicyType,
  UserDocument,
} from "@/lib/types";
import type {
  PolicyDocumentExtractionResult,
  PolicyDocumentExtractor,
} from "@/lib/document-analysis";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_EXTRACTION_MODEL = "gpt-5.2";
const premiumFrequencies = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
] as const;

type OpenAIPolicyExtractionPayload = {
  provider: string | null;
  policy_type: string;
  policy_subtype: string | null;
  policy_category_label: string | null;
  policy_number: string | null;
  premium_amount: number | null;
  premium_frequency: string | null;
  deductible: number | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  currency: string | null;
  coverage_amount: number | null;
  details: Record<string, unknown>;
  extraction_confidence: number | null;
  extraction_notes: string | null;
};

export class OpenAIPolicyExtractionError extends Error {
  readonly internalMessage: string;

  constructor(internalMessage: string, publicMessage?: string) {
    super(
      publicMessage ??
        "Analisi AI non riuscita. Riprova tra poco o crea la polizza manualmente."
    );
    this.name = "OpenAIPolicyExtractionError";
    this.internalMessage = getInternalFailureReason(internalMessage);
  }
}

function getOpenAIAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIPolicyExtractionError(
      "OPENAI_API_KEY missing",
      "Analisi AI non configurata. Aggiungi OPENAI_API_KEY al file .env.local."
    );
  }

  return apiKey;
}

function getOpenAIExtractionModel() {
  return (
    process.env.OPENAI_POLICY_EXTRACTION_MODEL?.trim() ||
    DEFAULT_OPENAI_EXTRACTION_MODEL
  );
}

function normalizeNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeDate(value: unknown) {
  const date = normalizeNullableString(value);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return Number.isFinite(new Date(`${date}T00:00:00Z`).getTime())
    ? date
    : null;
}

function normalizePremiumFrequency(value: unknown): PolicyPremiumFrequency {
  return premiumFrequencies.includes(value as PolicyPremiumFrequency)
    ? (value as PolicyPremiumFrequency)
    : "monthly";
}

function normalizePolicyType(value: unknown): TypedPolicyType {
  return typeof value === "string" && isTypedPolicyType(value)
    ? value
    : "other";
}

function normalizeConfidence(value: unknown) {
  const confidence = normalizeNullableNumber(value);

  if (confidence === null) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(confidence)));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    ),
  ];
}

function getPayloadRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const fieldConfidenceKeys = [
  "provider",
  "policy_type",
  "policy_number",
  "premium_amount",
  "premium_frequency",
  "deductible",
  "start_date",
  "end_date",
  "renewal_date",
  "currency",
  "coverage_amount",
  "details",
] as const satisfies readonly PolicyFieldConfidenceKey[];

function isFieldConfidenceKey(value: string): value is PolicyFieldConfidenceKey {
  return fieldConfidenceKeys.includes(value as PolicyFieldConfidenceKey);
}

function mergeFieldConfidence(
  details: Record<string, unknown>,
  key: string,
  value: string | number | boolean | null,
  confidence: number | null,
  evidence: string | null,
  force = false
) {
  const source = getPayloadRecord(details.field_confidence);

  if (!force && source[key]) {
    return;
  }

  details.field_confidence = {
    ...source,
    [key]: {
      value,
      confidence,
      uncertain: confidence !== null && confidence < 75,
      evidence,
    },
  };
}

function mergePayloadFieldConfidence(
  detailsSource: Record<string, unknown>,
  payloadDetails: Record<string, unknown>
) {
  const source = getPayloadRecord(payloadDetails.field_confidence);

  for (const [key, rawValue] of Object.entries(source)) {
    if (!isFieldConfidenceKey(key) || !rawValue || typeof rawValue !== "object") {
      continue;
    }

    const item = rawValue as {
      value?: unknown;
      confidence?: unknown;
      uncertain?: unknown;
      evidence?: unknown;
    };

    if (
      item.value === undefined ||
      (typeof item.value !== "string" &&
        typeof item.value !== "number" &&
        typeof item.value !== "boolean" &&
        item.value !== null)
    ) {
      continue;
    }

    mergeFieldConfidence(
      detailsSource,
      key,
      item.value,
      normalizeConfidence(item.confidence),
      normalizeNullableString(item.evidence),
      true
    );

    const merged = getPayloadRecord(detailsSource.field_confidence)[key] as {
      uncertain?: boolean;
    };

    if (typeof item.uncertain === "boolean" && merged) {
      merged.uncertain = item.uncertain;
    }
  }
}

function getResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: unknown }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .filter((textPart): textPart is string => typeof textPart === "string")
    .join("");

  return text || null;
}

function getResponseRefusal(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output?: Array<{
      content?: Array<{ refusal?: unknown; type?: string }>;
    }>;
  };

  const refusal = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.refusal)
    .find(
      (value): value is string =>
        typeof value === "string" && value.length > 0
    );

  return refusal ?? null;
}

const nullableText = {
  anyOf: [{ type: "string" }, { type: "null" }],
};
const nullableNumber = {
  anyOf: [{ type: "number" }, { type: "null" }],
};
const nullableBoolean = {
  anyOf: [{ type: "boolean" }, { type: "null" }],
};
const nullablePolicySubtype = {
  anyOf: [{ type: "string", enum: swissPolicySubtypes }, { type: "null" }],
};

function getFieldConfidenceSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      value: {
        anyOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "null" },
        ],
      },
      confidence: nullableNumber,
      uncertain: { type: "boolean" },
      evidence: nullableText,
    },
    required: ["value", "confidence", "uncertain", "evidence"],
  };
}

function getFieldConfidenceSchemaProperties() {
  const fieldSchema = getFieldConfidenceSchema();

  return {
    provider: fieldSchema,
    policy_type: fieldSchema,
    policy_number: fieldSchema,
    premium_amount: fieldSchema,
    premium_frequency: fieldSchema,
    deductible: fieldSchema,
    start_date: fieldSchema,
    end_date: fieldSchema,
    renewal_date: fieldSchema,
    currency: fieldSchema,
    coverage_amount: fieldSchema,
    details: fieldSchema,
  };
}

function getDiscountSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      label: nullableText,
      amount: nullableNumber,
      notes: nullableText,
    },
    required: ["label", "amount", "notes"],
  };
}

function getCoverageLineSchema(includePolicyFields: boolean) {
  const properties: Record<string, unknown> = {
    name: { type: "string" },
    coverage_type: nullablePolicySubtype,
    category_label: nullableText,
    premium_gross: nullableNumber,
    premium_amount: nullableNumber,
    premium_final: nullableNumber,
    premium_frequency: {
      anyOf: [{ type: "string", enum: premiumFrequencies }, { type: "null" }],
    },
    discounts: {
      type: "array",
      items: getDiscountSchema(),
    },
    insured_person_name: nullableText,
    insured_number: nullableText,
    section_id: nullableText,
    source_page: nullableNumber,
    source_order: nullableNumber,
    person_index: nullableNumber,
    applies_to: nullableText,
    confidence: nullableNumber,
    ownership_confidence: nullableNumber,
    uncertain: { type: "boolean" },
    notes: nullableText,
  };

  const required = [
    "name",
    "coverage_type",
    "category_label",
    "premium_gross",
    "premium_amount",
    "premium_final",
    "premium_frequency",
    "discounts",
    "insured_person_name",
    "insured_number",
    "section_id",
    "source_page",
    "source_order",
    "person_index",
    "applies_to",
    "confidence",
    "ownership_confidence",
    "uncertain",
    "notes",
  ];

  if (includePolicyFields) {
    properties.policy_type = {
      anyOf: [{ type: "string", enum: typedPolicyTypes }, { type: "null" }],
    };
    properties.deductible = nullableNumber;
    properties.franchise = nullableNumber;
    properties.coverage_amount = nullableNumber;
    required.push("policy_type", "deductible", "franchise", "coverage_amount");
  }

  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
  };
}

function getPolicyProductSchema() {
  return getCoverageLineSchema(false);
}

function getCoverageSchema() {
  return getCoverageLineSchema(true);
}

function getBaseInsuranceSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      name: nullableText,
      model: nullableText,
      premium_amount: nullableNumber,
      franchise: nullableNumber,
      notes: nullableText,
    },
    required: ["name", "model", "premium_amount", "franchise", "notes"],
  };
}

function getPremiumSummarySchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      total_monthly: nullableNumber,
      total_annual: nullableNumber,
      gross_monthly: nullableNumber,
      discounts_total: nullableNumber,
      final_monthly: nullableNumber,
      currency: nullableText,
      notes: nullableText,
    },
    required: [
      "total_monthly",
      "total_annual",
      "gross_monthly",
      "discounts_total",
      "final_monthly",
      "currency",
      "notes",
    ],
  };
}

function getInsuredPersonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      name: nullableText,
      birth_date: nullableText,
      insured_number: nullableText,
      customer_number: nullableText,
      policy_number: nullableText,
      section_id: nullableText,
      source_order: nullableNumber,
      premium_amount: nullableNumber,
      premium_frequency: {
        anyOf: [{ type: "string", enum: premiumFrequencies }, { type: "null" }],
      },
      total_monthly_premium: nullableNumber,
      base_premium: nullableNumber,
      complementary_premium: nullableNumber,
      franchise: nullableNumber,
      deductible: nullableNumber,
      model: nullableText,
      accident_covered: nullableBoolean,
      coverages: {
        type: "array",
        items: getCoverageSchema(),
      },
      confidence: nullableNumber,
      uncertain: { type: "boolean" },
    },
    required: [
      "name",
      "birth_date",
      "insured_number",
      "customer_number",
      "policy_number",
      "section_id",
      "source_order",
      "premium_amount",
      "premium_frequency",
      "total_monthly_premium",
      "base_premium",
      "complementary_premium",
      "franchise",
      "deductible",
      "model",
      "accident_covered",
      "coverages",
      "confidence",
      "uncertain",
    ],
  };
}

function getExtractionMetadataSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      matched_keywords: { type: "array", items: { type: "string" } },
      inferred_sections: { type: "array", items: { type: "string" } },
      warnings: { type: "array", items: { type: "string" } },
      provider_raw: nullableText,
      normalized_provider: nullableText,
      provider_aliases_matched: { type: "array", items: { type: "string" } },
      detected_languages: { type: "array", items: { type: "string" } },
      source_hints: { type: "array", items: { type: "string" } },
    },
    required: [
      "matched_keywords",
      "inferred_sections",
      "warnings",
      "provider_raw",
      "normalized_provider",
      "provider_aliases_matched",
      "detected_languages",
      "source_hints",
    ],
  };
}

function getDetailsSchemaProperties() {
  const fieldConfidenceSchemaProperties = getFieldConfidenceSchemaProperties();

  return {
    coverage_kind: nullablePolicySubtype,
    franchise: nullableNumber,
    deductible: nullableNumber,
    model: nullableText,
    complementary: nullableBoolean,
    hospital_coverage: nullableText,
    accident_covered: nullableBoolean,
    telemedicine: nullableBoolean,
    family_doctor_model: nullableBoolean,
    base_insurance: {
      anyOf: [getBaseInsuranceSchema(), { type: "null" }],
    },
    travel_coverage: nullableText,
    legal_protection: nullableText,
    premium_summary: {
      anyOf: [getPremiumSummarySchema(), { type: "null" }],
    },
    collective_contract: nullableBoolean,
    canton_or_premium_region: nullableText,
    cancellation_deadline: nullableText,
    complementary_products: {
      type: "array",
      items: getPolicyProductSchema(),
    },
    insured_people: {
      type: "array",
      items: getInsuredPersonSchema(),
    },
    coverages: {
      type: "array",
      items: getCoverageSchema(),
    },
    products: {
      type: "array",
      items: getPolicyProductSchema(),
    },
    field_confidence: {
      type: "object",
      additionalProperties: false,
      properties: fieldConfidenceSchemaProperties,
      required: Object.keys(fieldConfidenceSchemaProperties),
    },
    extraction_metadata: getExtractionMetadataSchema(),
    plate_number: nullableText,
    casco: nullableText,
    bonus_malus: nullableText,
    annual_km: nullableNumber,
    insured_sum: nullableNumber,
    glass_coverage: nullableBoolean,
    theft_coverage: nullableBoolean,
    liability_limit: nullableNumber,
    household_members_included: nullableNumber,
    private_legal: nullableBoolean,
    traffic_legal: nullableBoolean,
    coverage_region: nullableText,
    generic_details: nullableText,
  };
}

const policyExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    provider: { anyOf: [{ type: "string" }, { type: "null" }] },
    policy_type: { type: "string", enum: typedPolicyTypes },
    policy_subtype: nullablePolicySubtype,
    policy_category_label: nullableText,
    policy_number: { anyOf: [{ type: "string" }, { type: "null" }] },
    premium_amount: { anyOf: [{ type: "number" }, { type: "null" }] },
    premium_frequency: {
      anyOf: [{ type: "string", enum: premiumFrequencies }, { type: "null" }],
    },
    deductible: { anyOf: [{ type: "number" }, { type: "null" }] },
    start_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    end_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    renewal_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    currency: { anyOf: [{ type: "string" }, { type: "null" }] },
    coverage_amount: { anyOf: [{ type: "number" }, { type: "null" }] },
    details: {
      type: "object",
      additionalProperties: false,
      properties: getDetailsSchemaProperties(),
      required: Object.keys(getDetailsSchemaProperties()),
    },
    extraction_confidence: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    extraction_notes: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: [
    "provider",
    "policy_type",
    "policy_subtype",
    "policy_category_label",
    "policy_number",
    "premium_amount",
    "premium_frequency",
    "deductible",
    "start_date",
    "end_date",
    "renewal_date",
    "currency",
    "coverage_amount",
    "details",
    "extraction_confidence",
    "extraction_notes",
  ],
};

function normalizeOpenAIExtraction(
  payload: OpenAIPolicyExtractionPayload,
  document: UserDocument,
  extractedText: string
): PolicyDocumentExtractionResult {
  const payloadDetails = getPayloadRecord(payload.details);
  const classificationContext = [
    payload.policy_type,
    payload.policy_subtype,
    payload.policy_category_label,
    document.fileName,
    JSON.stringify(payloadDetails).slice(0, 3000),
  ]
    .filter(Boolean)
    .join("\n");
  const classification = normalizeSwissPolicyClassification(
    payload.policy_subtype ?? payload.policy_category_label ?? payload.policy_type,
    classificationContext
  );
  const fallbackPolicyType = normalizePolicyType(payload.policy_type);
  const policyType =
    classification.policyType === "other" && fallbackPolicyType !== "other"
      ? fallbackPolicyType
      : classification.policyType;
  const providerNormalization = normalizeSwissInsuranceProvider(
    payload.provider,
    `${document.fileName}\n${extractedText.slice(0, 5000)}`
  );
  const provider =
    providerNormalization.provider ??
    document.fileName.replace(/\.pdf$/i, "").slice(0, 80);
  const coverageKind =
    isSwissPolicySubtype(payload.policy_subtype ?? "")
      ? payload.policy_subtype
      : normalizeNullableString(payloadDetails.coverage_kind) ??
        classification.subtype;
  const metadata = getPayloadRecord(payloadDetails.extraction_metadata);
  const matchedKeywords = uniqueStrings([
    ...getSwissInsuranceKeywords(extractedText),
    ...classification.matchedKeywords,
    ...((Array.isArray(metadata.matched_keywords)
      ? metadata.matched_keywords
      : []) as string[]),
    providerNormalization.matchedAlias,
  ]);
  const detailsSource: Record<string, unknown> = {
    ...payloadDetails,
    coverage_kind: coverageKind,
    extraction_metadata: {
      ...metadata,
      matched_keywords: matchedKeywords,
      inferred_sections: Array.isArray(metadata.inferred_sections)
        ? metadata.inferred_sections
        : [],
      warnings: Array.isArray(metadata.warnings) ? metadata.warnings : [],
      provider_raw: normalizeNullableString(payload.provider),
      normalized_provider: provider,
      provider_aliases_matched: providerNormalization.matchedAlias
        ? [providerNormalization.matchedAlias]
        : [],
      detected_languages: Array.isArray(metadata.detected_languages)
        ? metadata.detected_languages
        : [],
      source_hints: Array.isArray(metadata.source_hints) ? metadata.source_hints : [],
    },
  };

  mergePayloadFieldConfidence(detailsSource, payloadDetails);

  mergeFieldConfidence(
    detailsSource,
    "provider",
    provider,
    providerNormalization.confidence,
    providerNormalization.matchedAlias
  );
  const payloadFieldConfidence = getPayloadRecord(payloadDetails.field_confidence);
  const policyTypeConfidenceSource = payloadFieldConfidence.policy_type;

  mergeFieldConfidence(
    detailsSource,
    "policy_type",
    policyType,
    policyTypeConfidenceSource &&
      typeof policyTypeConfidenceSource === "object" &&
      !Array.isArray(policyTypeConfidenceSource)
      ? normalizeConfidence(
          (policyTypeConfidenceSource as { confidence?: unknown }).confidence
        ) ?? 82
      : 82,
    `policy_type:${policyType}`
  );
  mergeFieldConfidence(
    detailsSource,
    "policy_number",
    normalizeNullableString(payload.policy_number),
    normalizeNullableString(payload.policy_number) ? 78 : 35,
    normalizeNullableString(payload.policy_number) ?? "missing"
  );
  mergeFieldConfidence(
    detailsSource,
    "premium_amount",
    normalizeNullableNumber(payload.premium_amount),
    normalizeNullableNumber(payload.premium_amount) === null ? 40 : 80,
    normalizeNullableNumber(payload.premium_amount) === null ? "missing" : "extracted"
  );
  mergeFieldConfidence(
    detailsSource,
    "deductible",
    normalizeNullableNumber(payload.deductible),
    normalizeNullableNumber(payload.deductible) === null ? 45 : 78,
    "deductible"
  );
  mergeFieldConfidence(
    detailsSource,
    "renewal_date",
    normalizeDate(payload.renewal_date),
    normalizeDate(payload.renewal_date) ? 70 : 38,
    normalizeDate(payload.renewal_date) ?? "missing"
  );

  const details = sanitizePolicyDetails(policyType, detailsSource) as PolicyDetails;
  const extractionNotes =
    normalizeNullableString(payload.extraction_notes) ??
    "Estrazione OpenAI completata. Verificare i dati prima di confermare la bozza.";

  return {
    processingMs: 0,
    draft: {
      documentId: null,
      provider,
      policyType,
      policyCategoryLabel:
        normalizeNullableString(payload.policy_category_label) ??
        (classification.subtype === "other" ? null : classification.categoryLabel),
      policyNumber: normalizeNullableString(payload.policy_number),
      premiumAmount: normalizeNullableNumber(payload.premium_amount),
      premiumFrequency: normalizePremiumFrequency(payload.premium_frequency),
      deductible: normalizeNullableNumber(payload.deductible),
      startDate: normalizeDate(payload.start_date),
      endDate: normalizeDate(payload.end_date),
      renewalDate: normalizeDate(payload.renewal_date),
      currency: normalizeNullableString(payload.currency)?.toUpperCase() ?? "CHF",
      coverageAmount: normalizeNullableNumber(payload.coverage_amount),
      details,
      notes: null,
      extractionConfidence: normalizeConfidence(payload.extraction_confidence),
      extractionNotes,
    },
  };
}

async function callOpenAIForPolicyExtraction(
  document: UserDocument,
  text: string
) {
  const model = getOpenAIExtractionModel();
  const hasOpenAIAPIKey = Boolean(process.env.OPENAI_API_KEY);

  logPolicyAnalysisInfo("openai_request_start", {
    documentId: document.id,
    fileName: document.fileName,
    hasOpenAIAPIKey,
    model,
    extractedTextLength: text.length,
  });

  const apiKey = getOpenAIAPIKey();

  let response: Response;

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          [
            "Extract Swiss insurance policy data from readable PDF text. Return JSON only using the schema.",
            "You are Swiss-insurance-aware: recognize LAMal/KVG base insurance, LCA/VVG complementary insurance, hospital coverage, dental, accident, household, private liability, car, casco partial/full, legal protection, travel, life, income protection, business insurance, and other.",
            "Use policy_type only as the broad Atlas category: health, liability, household, car, legal, other. Use policy_subtype for the specific Swiss category.",
            "Normalize provider names when obvious, but keep uncertain fields null. Do not invent policy numbers, dates, premiums, franchises, persons, or coverages.",
            "Swiss insurance PDFs often repeat blocks per insured person. Treat headings with person name, birth date, insured number (n. d'assicurato / Versichertennummer), customer number, contract or policy number as section anchors. Preserve PDF source order using source_order (increasing integers in reading order) and source_page when visible.",
            "For each insured person create details.insured_people[] with section_id, source_order, coverages[] nested under that person, per-person totals (total_monthly_premium, base_premium, complementary_premium), franchise, model. Also mirror lines in details.coverages[] with ownership fields when clear.",
            "For each product/coverage line extract: name, Swiss kind (LAMal/KVG base, LCA/VVG complementary, hospital, legal protection, travel/foreign, accident, Telmed, HMO, family doctor model), premium_gross, discounts[] (label+amount for reductions), premium_final (payable), premium_amount same as premium_final, insured_person_name, insured_number, section_id, source_order, ownership_confidence (0-100, null if unknown).",
            "Distinguish gross premium, discounts/reductions, final payable premium, per-person total, and family/contract total. Put contract/family payable total in premium_amount and premium_summary.final_monthly; never use family total as a person line premium.",
            "Assign ownership using nearest section anchor and insured number. If ownership is unclear set insured_person_name null, ownership_confidence low, uncertain true. Prefer null over guessing.",
            "One primary draft per PDF. For health fill hospital_coverage, telemedicine, family_doctor_model, base_insurance, premium_summary (gross_monthly, discounts_total, final_monthly), collective_contract, canton_or_premium_region, cancellation_deadline, travel_coverage, legal_protection when explicit.",
            "Every important field needs field_confidence with value, confidence 0-100, uncertain true when the evidence is weak, and a short evidence snippet. Use null and uncertainty instead of hallucinating.",
            "Add extraction_metadata.matched_keywords, inferred_sections, and warnings for ambiguous or missing information. Dates must be YYYY-MM-DD. Currency should usually be CHF.",
          ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Filename: ${document.fileName}\n\nPDF text:\n${text}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "atlas_policy_extraction",
            strict: true,
            schema: policyExtractionSchema,
          },
        },
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown fetch error";

    logPolicyAnalysisError("openai_request_network_failed", {
      documentId: document.id,
      model,
      error: message,
    });

    throw new OpenAIPolicyExtractionError(
      `OpenAI request failed before HTTP response: ${message}`
    );
  }

  const requestId = response.headers.get("x-request-id");

  logPolicyAnalysisInfo("openai_response_received", {
    documentId: document.id,
    httpStatus: response.status,
    requestId,
    model,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const internalReason = `OpenAI HTTP ${response.status}: ${errorText}`;

    logPolicyAnalysisError("openai_request_failed", {
      documentId: document.id,
      httpStatus: response.status,
      requestId,
      model,
      errorBody: errorText,
    });

    throw new OpenAIPolicyExtractionError(
      internalReason,
      "Analisi AI non riuscita. Verifica configurazione OpenAI o riprova tra poco."
    );
  }

  let payload: unknown;

  try {
    payload = (await response.json()) as unknown;
  } catch (error) {
    logPolicyAnalysisError("openai_response_json_parse_failed", {
      documentId: document.id,
      requestId,
      model,
      error: error instanceof Error ? error.message : "Unknown parse error",
    });

    throw new OpenAIPolicyExtractionError(
      error instanceof Error
        ? `OpenAI response JSON parse failed: ${error.message}`
        : "OpenAI response JSON parse failed"
    );
  }

  const refusal = getResponseRefusal(payload);

  if (refusal) {
    logPolicyAnalysisError("openai_response_refused", {
      documentId: document.id,
      requestId,
      model,
      refusal,
    });

    throw new OpenAIPolicyExtractionError(`OpenAI refusal: ${refusal}`);
  }

  const outputText = getResponseText(payload);

  if (!outputText) {
    logPolicyAnalysisError("openai_response_missing_output_text", {
      documentId: document.id,
      requestId,
      model,
    });

    throw new OpenAIPolicyExtractionError(
      "OpenAI response did not contain output_text"
    );
  }

  try {
    return JSON.parse(outputText) as OpenAIPolicyExtractionPayload;
  } catch (error) {
    logPolicyAnalysisError("openai_structured_output_parse_failed", {
      documentId: document.id,
      requestId,
      model,
      outputTextLength: outputText.length,
      error: error instanceof Error ? error.message : "Unknown parse error",
    });

    throw new OpenAIPolicyExtractionError(
      error instanceof Error
        ? `OpenAI structured output parse failed: ${error.message}`
        : "OpenAI structured output parse failed"
    );
  }
}

export const openAIPolicyDocumentExtractor: PolicyDocumentExtractor = {
  async extract(document) {
    const pdf = await downloadCurrentUserDocumentFile(document);
    const text = await extractReadableTextFromPdf(pdf);
    const extraction = await callOpenAIForPolicyExtraction(document, text);
    const normalized = normalizeOpenAIExtraction(extraction, document, text);

    return enrichSwissPolicyExtraction(normalized, document, text);
  },
};
