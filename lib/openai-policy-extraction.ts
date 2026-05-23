import "server-only";

import { downloadCurrentUserDocumentFile } from "@/lib/documents";
import { extractReadableTextFromPdf } from "@/lib/pdf-text";
import {
  isTypedPolicyType,
  sanitizePolicyDetails,
  typedPolicyTypes,
} from "@/lib/policy-types";
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
  constructor(message: string) {
    super(message);
    this.name = "OpenAIPolicyExtractionError";
  }
}

function getOpenAIAPIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIPolicyExtractionError(
      "OPENAI_API_KEY non configurata. Aggiungila a .env.local per usare l'estrazione reale."
    );
  }

  return apiKey;
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

function getDetailsSchemaProperties() {
  const nullableText = {
    anyOf: [{ type: "string" }, { type: "null" }],
  };
  const nullableNumber = {
    anyOf: [{ type: "number" }, { type: "null" }],
  };
  const nullableBoolean = {
    anyOf: [{ type: "boolean" }, { type: "null" }],
  };

  return {
    franchise: nullableNumber,
    model: nullableText,
    complementary: nullableBoolean,
    hospital_coverage: nullableText,
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
  document: UserDocument
): PolicyDocumentExtractionResult {
  const policyType = normalizePolicyType(payload.policy_type);
  const details = sanitizePolicyDetails(
    policyType,
    payload.details
  ) as PolicyDetails;
  const provider =
    normalizeNullableString(payload.provider) ??
    document.fileName.replace(/\.pdf$/i, "").slice(0, 80);
  const extractionNotes =
    normalizeNullableString(payload.extraction_notes) ??
    "Estrazione OpenAI completata. Verificare i dati prima di confermare la bozza.";

  return {
    processingMs: 0,
    draft: {
      documentId: null,
      provider,
      policyType,
      policyCategoryLabel: null,
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
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIAPIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.OPENAI_POLICY_EXTRACTION_MODEL ??
        DEFAULT_OPENAI_EXTRACTION_MODEL,
      instructions:
        "Extract Swiss insurance policy data from the provided PDF text. Return JSON only using the schema. Use null for unknown values. Choose policy_type from health, liability, household, car, legal, other. Fill details only with fields relevant to the chosen type and set irrelevant detail fields to null. Dates must be YYYY-MM-DD. Currency should usually be CHF.",
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

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    throw new OpenAIPolicyExtractionError(
      `OpenAI extraction failed (${response.status}). ${errorText.slice(0, 240)}`
    );
  }

  const payload = (await response.json()) as unknown;
  const outputText = getResponseText(payload);

  if (!outputText) {
    throw new OpenAIPolicyExtractionError(
      "OpenAI non ha restituito JSON estraibile."
    );
  }

  return JSON.parse(outputText) as OpenAIPolicyExtractionPayload;
}

export const openAIPolicyDocumentExtractor: PolicyDocumentExtractor = {
  async extract(document) {
    const pdf = await downloadCurrentUserDocumentFile(document);
    const text = extractReadableTextFromPdf(pdf);
    const extraction = await callOpenAIForPolicyExtraction(document, text);

    return normalizeOpenAIExtraction(extraction, document);
  },
};
