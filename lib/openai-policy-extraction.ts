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
    const text = extractReadableTextFromPdf(pdf);
    const extraction = await callOpenAIForPolicyExtraction(document, text);

    return normalizeOpenAIExtraction(extraction, document);
  },
};
