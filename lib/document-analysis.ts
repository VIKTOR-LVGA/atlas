import "server-only";

import {
  DocumentManagementError,
  getCurrentUserDocumentById,
  updateCurrentUserDocumentStatus,
} from "@/lib/documents";
import { createPolicy, PolicyManagementError } from "@/lib/policies";
import type { PolicyInput, UserDocument, UserPolicy } from "@/lib/types";

type MockPolicyTemplate = {
  provider: string;
  policyType: string;
  premiums: number[];
  deductibles: number[];
  keywords: string[];
};

export type PolicyExtractionDraft = Pick<
  PolicyInput,
  | "provider"
  | "policyType"
  | "premiumAmount"
  | "deductible"
  | "renewalDate"
> & {
  confidence: {
    provider: number;
    policyType: number;
    premiumAmount: number;
    deductible: number;
    renewalDate: number;
  };
};

export type PolicyDocumentExtractionResult = {
  draft: PolicyExtractionDraft;
  processingMs: number;
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

const mockTemplates: MockPolicyTemplate[] = [
  {
    provider: "Helsana",
    policyType: "Assicurazione complementare salute",
    premiums: [94.8, 126.5, 182.4],
    deductibles: [300, 500, 1000],
    keywords: ["helsana", "sanita", "salute", "health", "complementare"],
  },
  {
    provider: "AXA",
    policyType: "Assicurazione auto",
    premiums: [78.2, 118.6, 164.9],
    deductibles: [500, 1000, 1500],
    keywords: ["axa", "auto", "casco", "vehicle", "veicolo"],
  },
  {
    provider: "la Mobiliare",
    policyType: "RC privata e mobilia domestica",
    premiums: [24.9, 38.4, 57.7],
    deductibles: [200, 500, 1000],
    keywords: ["mobiliar", "mobilia", "casa", "rc", "household"],
  },
  {
    provider: "Zurich",
    policyType: "Protezione giuridica",
    premiums: [19.5, 31.8, 48.3],
    deductibles: [0, 200, 500],
    keywords: ["zurich", "legal", "giuridica", "recht", "protection"],
  },
  {
    provider: "Swiss Life",
    policyType: "Assicurazione vita",
    premiums: [142, 215, 318],
    deductibles: [0, 0, 0],
    keywords: ["vita", "life", "previdenza", "swisslife", "pensione"],
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

function pickValue<T>(values: readonly T[], seed: number, offset: number) {
  return values[(seed + offset) % values.length];
}

function getMockRenewalDate(seed: number) {
  const renewalDate = new Date();
  renewalDate.setUTCDate(renewalDate.getUTCDate() + 90 + (seed % 240));

  return renewalDate.toISOString().slice(0, 10);
}

function getConfidence(seed: number, floor: number, offset: number) {
  return Math.min(98, floor + ((seed + offset) % 10));
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
        policyType: template.policyType,
        premiumAmount: pickValue(template.premiums, seed, 1),
        deductible: pickValue(template.deductibles, seed, 3),
        renewalDate: getMockRenewalDate(seed),
        confidence: {
          provider: getConfidence(seed, 87, 1),
          policyType: getConfidence(seed, 84, 3),
          premiumAmount: getConfidence(seed, 78, 5),
          deductible: getConfidence(seed, 76, 7),
          renewalDate: getConfidence(seed, 80, 9),
        },
      },
    };
  },
};

function getDraftNotes(document: UserDocument, extraction: PolicyDocumentExtractionResult) {
  return [
    "Bozza generata da estrazione simulata Atlas.",
    `Documento sorgente: ${document.fileName}.`,
    `Tempo simulato: ${(extraction.processingMs / 1000).toFixed(1)}s.`,
    "Verifica compagnia, premio, franchigia e data rinnovo prima di usare questi dati.",
  ].join("\n");
}

export async function analyzeCurrentUserDocument(
  id: string,
  extractor: PolicyDocumentExtractor = mockPolicyDocumentExtractor
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
        premiumAmount: extraction.draft.premiumAmount,
        premiumFrequency: "monthly",
        deductible: extraction.draft.deductible,
        renewalDate: extraction.draft.renewalDate,
        notes: getDraftNotes(processingDocument, extraction),
      },
      {
        source: "ai_draft",
        requiresReview: true,
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
