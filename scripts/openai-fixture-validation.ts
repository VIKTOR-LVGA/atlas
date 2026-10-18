#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { extractReadableTextFromPdf } from "../lib/pdf-text";
import { extractQuoteStructureFromText } from "../lib/openai-policy-extraction";
import {
  canPersistAsPersonalPolicy,
  classifyInsuranceDocument,
} from "../lib/insurance-knowledge";
import type { PolicyDetails, UserDocument } from "../lib/types";

const completeFixture = resolve(
  process.cwd(),
  "e2e/fixtures/swiss-motor-policy-synthetic.pdf"
);
const incompleteFixture = resolve(
  process.cwd(),
  "e2e/fixtures/swiss-policy-incomplete-synthetic.pdf"
);

function fixtureDocument(path: string, id: string): UserDocument {
  return {
    id,
    fileName: basename(path),
    filePath: `synthetic/${basename(path)}`,
    fileSize: null,
    mimeType: "application/pdf",
    status: "uploaded",
    analysisError: null,
    documentType: "unknown",
    documentLanguage: null,
    recognizedInsurer: null,
    classificationConfidence: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

function detailsCoverages(details: PolicyDetails) {
  return Array.isArray(details.coverages) ? details.coverages : [];
}

async function extractFixture(path: string, id: string) {
  const text = await extractReadableTextFromPdf(await readFile(path));
  const classification = classifyInsuranceDocument(text);
  const result = await extractQuoteStructureFromText(
    fixtureDocument(path, id),
    text
  );

  return { text, classification, result };
}

async function main() {
  assert.ok(
    process.env.OPENAI_API_KEY,
    "OPENAI_API_KEY is required for the real extraction fixture test"
  );

  const complete = await extractFixture(completeFixture, "synthetic-motor");
  assert.equal(
    canPersistAsPersonalPolicy(complete.classification.type),
    true,
    `Complete fixture classified as ${complete.classification.type}`
  );
  assert.equal(complete.result.draft.policyType, "car");
  assert.equal(complete.result.draft.policyNumber, "SYN-MOTOR-2026-0001");
  assert.equal(complete.result.draft.premiumFrequency, "annual");
  assert.ok(
    complete.result.draft.premiumAmount !== null &&
      Math.abs(complete.result.draft.premiumAmount - 864) < 0.01,
    `Expected CHF 864 annual, got ${complete.result.draft.premiumAmount}`
  );

  const completeCoverages = detailsCoverages(complete.result.draft.details);
  assert.ok(completeCoverages.length >= 4, "Expected at least four motor coverages");
  assert.ok(
    completeCoverages.some(
      (coverage) =>
        typeof coverage === "object" &&
        coverage !== null &&
        "evidence" in coverage &&
        typeof coverage.evidence === "string" &&
        coverage.evidence.length > 0
    ),
    "Expected at least one coverage with document evidence"
  );

  const incomplete = await extractFixture(
    incompleteFixture,
    "synthetic-incomplete"
  );
  assert.equal(
    incomplete.result.draft.premiumAmount,
    null,
    "Incomplete fixture must not invent a premium"
  );
  assert.equal(
    incomplete.result.draft.endDate,
    null,
    "Incomplete fixture must not invent an end date"
  );
  assert.equal(
    incomplete.result.draft.renewalDate,
    null,
    "Incomplete fixture must not invent a renewal date"
  );

  console.log(
    JSON.stringify(
      {
        complete: {
          classification: complete.classification.type,
          policyType: complete.result.draft.policyType,
          policyNumber: complete.result.draft.policyNumber,
          premiumAmount: complete.result.draft.premiumAmount,
          premiumFrequency: complete.result.draft.premiumFrequency,
          coverageCount: completeCoverages.length,
          confidence: complete.result.draft.extractionConfidence,
        },
        incomplete: {
          classification: incomplete.classification.type,
          premiumAmount: incomplete.result.draft.premiumAmount,
          confidence: incomplete.result.draft.extractionConfidence,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
