import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canonicalCoverageTaxonomy,
  canPersistAsPersonalPolicy,
  classifyInsuranceDocument,
  insuranceCategoryDefinitions,
  insuranceDocumentTypes,
  normalizeCoverageLabel,
  recognizeSwissInsurer,
} from "../lib/insurance-knowledge/index";

const fixtureRoot = resolve(process.cwd(), "test/fixtures/insurance-knowledge");

function fixture(name: string) {
  return readFileSync(resolve(fixtureRoot, name), "utf8");
}

const cases = [
  { file: "auto-it.txt", insurer: "axa", coverages: ["motor_liability", "partial_casco", "parking_damage"] },
  { file: "liability-de.txt", insurer: "zurich", coverages: ["private_liability", "tenant_damage"] },
  { file: "household-fr.txt", insurer: "vaudoise", coverages: ["household_contents", "water_damage", "cyber"] },
  { file: "health-basic-it.txt", insurer: "css", coverages: ["statutory_basic_health", "hmo_model"] },
  { file: "health-supplementary-de.txt", insurer: "helsana", coverages: ["ambulatory_supplementary", "hospital_semiprivate"] },
  { file: "legal-fr.txt", insurer: "generali", coverages: ["private_legal", "traffic_legal"] },
  { file: "travel-it.txt", insurer: "allianz", coverages: ["trip_cancellation", "repatriation", "baggage"] },
  { file: "life-pension-de.txt", insurer: "allianz", coverages: ["death_benefit", "disability_income", "premium_waiver", "investment_component"] },
] as const;

for (const testCase of cases) {
  const text = fixture(testCase.file);
  const document = classifyInsuranceDocument(text);
  const insurer = recognizeSwissInsurer(text);
  assert.equal(document.type, "policy", `${testCase.file}: document type`);
  assert.equal(insurer.insurerId, testCase.insurer, `${testCase.file}: insurer`);

  for (const coverage of testCase.coverages) {
    const definition = canonicalCoverageTaxonomy.find(
      (item) => item.canonicalType === coverage
    );
    assert.ok(definition, `${testCase.file}: missing taxonomy ${coverage}`);
    const labels = Object.values(definition.aliases).flat();
    assert.ok(
      labels.some((label) => normalizeCoverageLabel(label).canonicalType === coverage),
      `${testCase.file}: normalization ${coverage}`
    );
  }
}

const cga = classifyInsuranceDocument(fixture("axa-auto-cga-it.txt"));
assert.equal(cga.type, "general_conditions", "CGA must never classify as policy");
assert.equal(canPersistAsPersonalPolicy(cga.type), false, "CGA must not create a personal policy");
assert.equal(canPersistAsPersonalPolicy("policy"), true, "a policy can create a personal policy");

const requiredCategories = [
  "vehicle",
  "health_basic",
  "health_supplementary",
  "private_liability",
  "household",
  "legal_protection",
  "travel",
  "life",
  "pension",
] as const;

for (const category of requiredCategories) {
  assert.ok(
    insuranceCategoryDefinitions.some((item) => item.id === category),
    `missing canonical category ${category}`
  );
  assert.ok(
    canonicalCoverageTaxonomy.some((item) => item.category === category),
    `missing canonical coverages for ${category}`
  );
}

assert.equal(insuranceDocumentTypes.length, 11);
assert.ok(canonicalCoverageTaxonomy.length >= 55);
assert.equal(new Set(canonicalCoverageTaxonomy.map((item) => item.canonicalType)).size, canonicalCoverageTaxonomy.length);

console.info(
  `PASS Swiss knowledge benchmark ${cases.length + 1}/${cases.length + 1}; ` +
    `${canonicalCoverageTaxonomy.length} coverage types, ${insuranceDocumentTypes.length} document types`
);
