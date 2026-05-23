import "server-only";

import {
  DocumentManagementError,
  getCurrentUserDocumentById,
  updateCurrentUserDocumentStatus,
} from "@/lib/documents";
import { createPolicy, PolicyManagementError } from "@/lib/policies";
import { openAIPolicyDocumentExtractor } from "@/lib/openai-policy-extraction";
import { PdfTextExtractionError } from "@/lib/pdf-text";
import type {
  PolicyDetails,
  PolicyInput,
  TypedPolicyType,
  UserDocument,
  UserPolicy,
} from "@/lib/types";

type MockPolicyTemplate = {
  provider: string;
  policyType: TypedPolicyType;
  premiums: number[];
  deductibles: number[];
  coverageAmounts: Array<number | null>;
  keywords: string[];
  getDetails: (seed: number) => PolicyDetails;
};

export type PolicyExtractionDraft = PolicyInput & {
  extractionConfidence: number | null;
  extractionNotes: string | null;
  confidence?: {
    provider: number;
    policyType: number;
    premiumAmount: number;
    deductible: number;
    renewalDate: number;
    details: number;
  };
};

export type PolicyDocumentExtractionResult = {
  draft: PolicyExtractionDraft;
  processingMs: number;
  usedFallback?: boolean;
};

export interface PolicyDocumentExtractor {
  extract(document: UserDocument): Promise<PolicyDocumentExtractionResult>;
}

export class DocumentAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAnalysisError";
  }
}

function pickValue<T>(values: readonly T[], seed: number, offset: number) {
  return values[(seed + offset) % values.length];
}

function getSwissPlate(seed: number) {
  const cantons = ["TI", "ZH", "VD", "GE", "BE"];
  const number = 10000 + (seed % 889999);

  return `${pickValue(cantons, seed, 5)} ${number}`;
}

const mockTemplates: MockPolicyTemplate[] = [
  {
    provider: "Helsana",
    policyType: "health",
    premiums: [94.8, 126.5, 182.4],
    deductibles: [300, 500, 1000],
    coverageAmounts: [null, null, null],
    keywords: ["helsana", "sanita", "salute", "health", "malati", "cassa"],
    getDetails: (seed) => ({
      franchise: pickValue([300, 500, 1000, 2500], seed, 1),
      model: pickValue(["Standard", "Telmed", "HMO"], seed, 3),
      complementary: seed % 2 === 0,
      hospital_coverage: pickValue(
        ["Comune Svizzera", "Semi-privata Svizzera", "Privata mondo"],
        seed,
        7
      ),
    }),
  },
  {
    provider: "AXA",
    policyType: "car",
    premiums: [78.2, 118.6, 164.9],
    deductibles: [500, 1000, 1500],
    coverageAmounts: [20000, 45000, 75000],
    keywords: ["axa", "auto", "casco", "vehicle", "veicolo", "car"],
    getDetails: (seed) => ({
      plate_number: getSwissPlate(seed),
      casco: pickValue(["Totale", "Parziale", "Nessuna"], seed, 2),
      bonus_malus: pickValue(["35%", "45%", "55%"], seed, 4),
      annual_km: pickValue([8000, 12000, 18000], seed, 8),
    }),
  },
  {
    provider: "la Mobiliare",
    policyType: "liability",
    premiums: [17.4, 25.9, 39.8],
    deductibles: [0, 200, 500],
    coverageAmounts: [5000000, 10000000, 20000000],
    keywords: ["rc", "liability", "responsabil", "responsabilita"],
    getDetails: (seed) => ({
      liability_limit: pickValue([5000000, 10000000, 20000000], seed, 2),
      household_members_included: pickValue([1, 2, 4], seed, 6),
    }),
  },
  {
    provider: "la Mobiliare",
    policyType: "household",
    premiums: [24.9, 38.4, 57.7],
    deductibles: [200, 500, 1000],
    coverageAmounts: [60000, 90000, 140000],
    keywords: ["mobilia", "casa", "economia", "domestic", "household", "hausrat"],
    getDetails: (seed) => ({
      insured_sum: pickValue([60000, 90000, 140000], seed, 1),
      glass_coverage: seed % 2 === 0,
      theft_coverage: seed % 3 !== 0,
    }),
  },
  {
    provider: "Zurich",
    policyType: "legal",
    premiums: [19.5, 31.8, 48.3],
    deductibles: [0, 200, 500],
    coverageAmounts: [null, null, null],
    keywords: ["zurich", "legal", "giuridica", "recht", "protection"],
    getDetails: (seed) => ({
      private_legal: true,
      traffic_legal: seed % 2 === 0,
      coverage_region: pickValue(
        ["Svizzera", "Svizzera ed Europa", "Mondo esclusi USA"],
        seed,
        4
      ),
    }),
  },
  {
    provider: "Swiss Life",
    policyType: "other",
    premiums: [142, 215, 318],
    deductibles: [0, 0, 0],
    coverageAmounts: [50000, 100000, 150000],
    keywords: ["vita", "life", "previdenza", "swisslife", "pensione"],
    getDetails: () => ({
      generic_details:
        "Categoria non ancora specializzata: verificare coperture e beneficiari.",
    }),
  },
] as const;

function getStableSeed(value: string) {
  let seed = 0;

  for (const character of value.toLowerCase()) {
    seed = (seed * 31 + character.charCodeAt(0)) % 2147483647;
  }

  return Math.abs(seed);
}

function pickTemplate(fileName: string, seed: number) {
  const normalizedFileName = fileName.toLowerCase();

  return (
    mockTemplates.find((template) =>
      template.keywords.some((keyword) => normalizedFileName.includes(keyword))
    ) ?? mockTemplates[seed % mockTemplates.length]
  );
}

function getMockRenewalDate(seed: number) {
  const renewalDate = new Date();
  renewalDate.setUTCDate(renewalDate.getUTCDate() + 90 + (seed % 240));

  return renewalDate.toISOString().slice(0, 10);
}

function getConfidence(seed: number, floor: number, offset: number) {
  return Math.min(98, floor + ((seed + offset) % 10));
}

function getOverallConfidence(confidence: PolicyExtractionDraft["confidence"]) {
  if (!confidence) {
    return null;
  }

  const values = Object.values(confidence);
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round(total / values.length);
}

async function waitForMockExtraction(seed: number) {
  const processingMs = 2000 + (seed % 2001);

  await new Promise((resolve) => setTimeout(resolve, processingMs));

  return processingMs;
}

export const mockPolicyDocumentExtractor: PolicyDocumentExtractor = {
  async extract(document) {
    const seed = getStableSeed(`${document.fileName}:${document.id}`);
    const template = pickTemplate(document.fileName, seed);
    const processingMs = await waitForMockExtraction(seed);

    if (document.fileName.toLowerCase().includes("illeggibile")) {
      throw new DocumentAnalysisError(
        "Estrazione simulata non riuscita per questo PDF. Riprova o crea la polizza manualmente."
      );
    }

    return {
      processingMs,
      draft: {
        provider: template.provider,
        documentId: null,
        policyType: template.policyType,
        policyCategoryLabel: null,
        policyNumber: null,
        premiumAmount: pickValue(template.premiums, seed, 1),
        premiumFrequency: "monthly",
        deductible: pickValue(template.deductibles, seed, 3),
        startDate: null,
        endDate: null,
        renewalDate: getMockRenewalDate(seed),
        currency: "CHF",
        coverageAmount: pickValue(template.coverageAmounts, seed, 5),
        details: template.getDetails(seed),
        notes: null,
        extractionConfidence: null,
        extractionNotes: null,
        confidence: {
          provider: getConfidence(seed, 87, 1),
          policyType: getConfidence(seed, 84, 3),
          premiumAmount: getConfidence(seed, 78, 5),
          deductible: getConfidence(seed, 76, 7),
          renewalDate: getConfidence(seed, 80, 9),
          details: getConfidence(seed, 72, 11),
        },
      },
    };
  },
};

function getExtractionNotes(
  document: UserDocument,
  extraction: PolicyDocumentExtractionResult
) {
  if (extraction.draft.extractionNotes) {
    return extraction.draft.extractionNotes;
  }

  if (extraction.usedFallback) {
    return [
      "Fallback mock usato perche il PDF non contiene testo leggibile senza OCR.",
      `Documento sorgente: ${document.fileName}.`,
      "La bozza e plausibile ma non deriva da lettura reale del contenuto.",
    ].join("\n");
  }

  return [
    "Bozza generata da estrazione simulata Atlas.",
    `Documento sorgente: ${document.fileName}.`,
    `Tempo simulato: ${(extraction.processingMs / 1000).toFixed(1)}s.`,
    "Tipo e dettagli sono precompilati da template e richiedono revisione.",
  ].join("\n");
}

async function extractPolicyWithFallback(document: UserDocument) {
  try {
    return await openAIPolicyDocumentExtractor.extract(document);
  } catch (error) {
    if (error instanceof PdfTextExtractionError) {
      const fallbackExtraction = await mockPolicyDocumentExtractor.extract(document);

      return {
        ...fallbackExtraction,
        usedFallback: true,
      };
    }

    throw error;
  }
}

export async function analyzeCurrentUserDocument(
  id: string,
  extractor: PolicyDocumentExtractor = { extract: extractPolicyWithFallback }
): Promise<UserPolicy> {
  const document = await getCurrentUserDocumentById(id);

  if (!document) {
    throw new DocumentAnalysisError("Documento non trovato.");
  }

  if (document.status === "processing") {
    throw new DocumentAnalysisError("Analisi gia in corso per questo documento.");
  }

  if (document.status === "analyzed") {
    throw new DocumentAnalysisError("Questo documento e gia stato analizzato.");
  }

  const processingDocument = await updateCurrentUserDocumentStatus(
    document.id,
    "processing"
  );

  if (!processingDocument) {
    throw new DocumentAnalysisError("Documento non disponibile per l'analisi.");
  }

  try {
    const extraction = await extractor.extract(processingDocument);
    const policy = await createPolicy(
      {
        documentId: processingDocument.id,
        provider: extraction.draft.provider,
        policyType: extraction.draft.policyType,
        policyCategoryLabel: extraction.draft.policyCategoryLabel,
        policyNumber: extraction.draft.policyNumber,
        premiumAmount: extraction.draft.premiumAmount,
        premiumFrequency: extraction.draft.premiumFrequency,
        deductible: extraction.draft.deductible,
        startDate: extraction.draft.startDate,
        endDate: extraction.draft.endDate,
        renewalDate: extraction.draft.renewalDate,
        currency: extraction.draft.currency,
        coverageAmount: extraction.draft.coverageAmount,
        details: extraction.draft.details,
        notes: extraction.draft.notes,
      },
      {
        source: "ai_draft",
        requiresReview: true,
        extractionConfidence:
          extraction.draft.extractionConfidence ??
          getOverallConfidence(extraction.draft.confidence),
        extractionNotes: getExtractionNotes(processingDocument, extraction),
      }
    );

    await updateCurrentUserDocumentStatus(processingDocument.id, "analyzed");

    return policy;
  } catch (error) {
    await updateCurrentUserDocumentStatus(processingDocument.id, "failed").catch(
      () => null
    );

    if (
      error instanceof DocumentAnalysisError ||
      error instanceof DocumentManagementError ||
      error instanceof PolicyManagementError
    ) {
      throw error;
    }

    throw new DocumentAnalysisError(
      "Analisi simulata non riuscita. Riprova tra poco."
    );
  }
}
