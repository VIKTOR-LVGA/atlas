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

function assertApprox(actual: number | null | undefined, expected: number, label: string) {
  assert.ok(
    actual !== null && actual !== undefined && Math.abs(actual - expected) < 0.01,
    `${label}: expected ${expected}, got ${actual}`
  );
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

  // Parse the small synthetic fixtures before large/encrypted official PDFs.
  // pdf2json keeps process-global parser state that complex documents can poison.
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

  let officialHelsanaSummary: Record<string, unknown> | null = null;
  const officialHelsanaPath = process.env.ATLAS_OFFICIAL_HELSANA_PDF?.trim();
  if (officialHelsanaPath) {
    const helsana = await extractFixture(officialHelsanaPath, "official-helsana-readonly");
    assert.equal(helsana.classification.type, "policy");
    assert.equal(helsana.result.draft.provider, "Helsana");
    assert.equal(helsana.result.draft.policyType, "health");
    assert.equal(helsana.result.draft.premiumFrequency, "monthly");
    assertApprox(helsana.result.draft.premiumAmount, 863.55, "Helsana family total");

    const people = Array.isArray(helsana.result.draft.details.insured_people)
      ? helsana.result.draft.details.insured_people
      : [];
    const expected = new Map([
      ["Charles Muster", [340.7, 287.85, 52.85]],
      ["Isabella Muster", [353.8, 292.75, 61.05]],
      ["Melanie Muster", [169.05, 126.65, 42.4]],
    ]);
    assert.equal(people.length, 3, "Helsana must contain exactly three insured people");
    for (const person of people) {
      const amounts = expected.get(person.name ?? "");
      assert.ok(amounts, `Unexpected insured person ${person.name}`);
      assertApprox(person.total_monthly_premium, amounts[0], `${person.name} total`);
      assertApprox(person.base_premium, amounts[1], `${person.name} LAMal`);
      assertApprox(person.complementary_premium, amounts[2], `${person.name} LCA`);
      assert.ok((person.coverages?.length ?? 0) >= 2, `${person.name} coverages missing`);
      for (const coverage of person.coverages ?? []) {
        assert.equal(
          coverage.insured_person_name,
          person.name,
          `Coverage assigned to wrong person for ${person.name}`
        );
        assert.ok(coverage.source_page, `Coverage source page missing for ${person.name}`);
        assert.ok(coverage.evidence, `Coverage evidence missing for ${person.name}`);
      }
    }
    assertApprox(
      people.reduce((sum, person) => sum + (person.total_monthly_premium ?? 0), 0),
      863.55,
      "Helsana sum of insured totals"
    );
    officialHelsanaSummary = {
      classification: helsana.classification.type,
      premiumAmount: helsana.result.draft.premiumAmount,
      insuredPeople: people.length,
      coverageCounts: people.map((person) => person.coverages?.length ?? 0),
      confidence: helsana.result.draft.extractionConfidence,
    };
  }

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

  // Keep the encrypted official CGA last. pdf2json has process-global parser
  // state and this document can otherwise poison a subsequent PDF parse.
  let officialZurichSummary: Record<string, unknown> | null = null;
  const officialZurichPath = process.env.ATLAS_OFFICIAL_ZURICH_CGA_PDF?.trim();
  if (officialZurichPath) {
    const text = await extractReadableTextFromPdf(await readFile(officialZurichPath));
    const classification = classifyInsuranceDocument(text);
    assert.equal(classification.type, "general_conditions");
    assert.equal(canPersistAsPersonalPolicy(classification.type), false);
    officialZurichSummary = {
      classification: classification.type,
      createsPersonalPolicy: false,
      confidence: classification.confidence,
      reasoningSignals: classification.reasoningSignals,
    };
  }

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
        officialHelsana: officialHelsanaSummary,
        officialZurichCga: officialZurichSummary,
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
