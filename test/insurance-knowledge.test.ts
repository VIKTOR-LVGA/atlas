import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildExtractionKnowledgeContext,
  canonicalCoverageTaxonomy,
  canPersistAsPersonalPolicy,
  classifyInsuranceDocument,
  insuranceCategoryDefinitions,
  insuranceDocumentTypes,
  normalizeCoverageLabel,
  recognizeSwissInsurer,
  SWISS_INSURANCE_KNOWLEDGE_RULES,
  VERIFIED_SWISS_INSURANCE_RULES,
  officialSwissInsuranceCatalogs,
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

const zurichMotor = classifyInsuranceDocument(fixture("zurich-motor-personal-policy-it.txt"));
assert.equal(
  zurichMotor.type,
  "policy",
  "Zurich-like personal motor policy must not classify as general_conditions"
);
assert.equal(canPersistAsPersonalPolicy(zurichMotor.type), true);
assert.equal(zurichMotor.embeddedGeneralConditionsReference, true);

const privateMotorContext = buildExtractionKnowledgeContext(
  "polizza-auto-privata.pdf",
  [
    "Polizza veicoli a motore",
    "Prodotto Auto Privata Completa",
    "Veicolo Volvo XC40",
    "Casco collisione e casco parziale",
    "Responsabilita civile verso terzi",
  ].join("\n")
);
assert.equal(
  privateMotorContext.policyTypeGuess,
  "car",
  "'Auto Privata' must not be mistaken for private hospital coverage"
);
assert.notEqual(privateMotorContext.subtypeGuess, "hospital");

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

// Knowledge expansion: all links refer to external official publications.
// Catalog entries are never used as proof that a customer purchased a benefit.
const allSwissRules = [...SWISS_INSURANCE_KNOWLEDGE_RULES, ...VERIFIED_SWISS_INSURANCE_RULES];
assert.ok(VERIFIED_SWISS_INSURANCE_RULES.length >= 15, "expected broad Swiss insurance rule coverage");
assert.equal(new Set(allSwissRules.map((rule) => rule.id)).size, allSwissRules.length);
assert.ok(officialSwissInsuranceCatalogs.length >= 10, "expected insurer and regulator directories");
assert.equal(new Set(officialSwissInsuranceCatalogs.map((entry) => entry.id)).size, officialSwissInsuranceCatalogs.length);
for (const rule of VERIFIED_SWISS_INSURANCE_RULES) {
  assert.match(rule.id, /^ch-[a-z][a-z0-9-]*$/);
  assert.equal(rule.jurisdiction, "CH");
  assert.match(rule.sourceUrl ?? "", /^https:\/\//);
  assert.match(rule.lastReviewed, /^20\\d{2}-\\d{2}-\\d{2}$/);
  assert.ok(rule.extractionHint.includes(" ") && rule.riskIfMisread.length > 20);
}
for (const catalog of officialSwissInsuranceCatalogs) {
  assert.match(catalog.officialUrl, /^https:\/\//);
  assert.match(catalog.checkedAt, /^20\\d{2}-\\d{2}-\\d{2}$/);
  assert.ok(catalog.limitation.length > 40);
}
assert.ok(VERIFIED_SWISS_INSURANCE_RULES.some((rule) => rule.id.includes("motor-final-premium")));
assert.ok(VERIFIED_SWISS_INSURANCE_RULES.some((rule) => rule.id.includes("helsana-multiperson")));

assert.equal(insuranceDocumentTypes.length, 13);
const migrationSql = readdirSync(resolve(process.cwd(), "supabase/migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(resolve(process.cwd(), "supabase/migrations", name), "utf8"))
  .join("\n");
const latestDocumentConstraint = migrationSql
  .split("documents_document_type_check")
  .at(-1) ?? "";
for (const documentType of insuranceDocumentTypes) {
  assert.match(
    latestDocumentConstraint,
    new RegExp(`['\"]${documentType}['\"]`),
    `database document type constraint missing ${documentType}`
  );
}
assert.ok(canonicalCoverageTaxonomy.length >= 55);
assert.equal(new Set(canonicalCoverageTaxonomy.map((item) => item.canonicalType)).size, canonicalCoverageTaxonomy.length);

console.info(
  `PASS Swiss knowledge benchmark ${cases.length + 1}/${cases.length + 1}; ` +
    `${canonicalCoverageTaxonomy.length} coverage types, ${insuranceDocumentTypes.length} document types`
);
