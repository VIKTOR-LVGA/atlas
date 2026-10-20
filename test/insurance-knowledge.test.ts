import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildExtractionKnowledgeContext,
  getSwissInsuranceKnowledgeHints,
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
  swissCgaPdfSources,
  findSwissCgaSourceCandidates,
  getMultilingualCgaInterpretationHints,
  swissMultilingualCgaConcepts,
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

// End-to-end hint selection on synthetic samples modeled on Swiss insurance
// document structures. Never commit a customer's actual policy as a fixture.
const motorRealisticContext = buildExtractionKnowledgeContext(
  "vehicle-policy-synthetic.pdf",
  fixture("vehicle-final-net-synthetic-it.txt")
);
assert.equal(motorRealisticContext.policyTypeGuess, "car");
assert.ok(
  motorRealisticContext.ruleIds.includes("ch-verified-motor-final-premium-2026"),
  "motor final payable amount must receive the specific Swiss annual-vs-installment guidance"
);

const healthRealisticContext = buildExtractionKnowledgeContext(
  "family-health-synthetic.pdf",
  fixture("health-family-overview-synthetic-it.txt")
);
assert.equal(healthRealisticContext.policyTypeGuess, "health");
assert.ok(
  healthRealisticContext.ruleIds.includes("ch-verified-helsana-multiperson-overview-2026"),
  "Helsana multiperson monthly overview must receive the family-premium guidance"
);

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
assert.ok(officialSwissInsuranceCatalogs.length >= 19, "expected insurer and regulator directories");
assert.equal(new Set(officialSwissInsuranceCatalogs.map((entry) => entry.id)).size, officialSwissInsuranceCatalogs.length);
for (const rule of VERIFIED_SWISS_INSURANCE_RULES) {
  assert.match(rule.id, /^ch-[a-z][a-z0-9-]*$/);
  assert.equal(rule.jurisdiction, "CH");
  assert.match(rule.sourceUrl ?? "", /^https:\/\//);
  assert.match(rule.lastReviewed, /^20\d{2}-\d{2}-\d{2}$/);
  assert.ok(rule.extractionHint.includes(" ") && rule.riskIfMisread.length > 20);
}
for (const catalog of officialSwissInsuranceCatalogs) {
  assert.match(catalog.officialUrl, /^https:\/\//);
  assert.match(catalog.checkedAt, /^20\d{2}-\d{2}-\d{2}$/);
  assert.ok(catalog.limitation.length > 40);
  const domain = new URL(catalog.officialUrl).hostname;
  assert.ok(
    domain.endsWith(".ch") || ["www.sanitas.com", "www.helvetia.com"].includes(domain),
    "unexpected off-domain catalog source: " + domain
  );
}
assert.ok(VERIFIED_SWISS_INSURANCE_RULES.some((rule) => rule.id.includes("motor-final-premium")));
assert.ok(VERIFIED_SWISS_INSURANCE_RULES.some((rule) => rule.id.includes("helsana-multiperson")));

// The new knowledge must actually enter the prompt's selected hints.
const motorPremiumHints = getSwissInsuranceKnowledgeHints({
  policyTypeGuess: "car",
  extractedTextSignals: [
    "Totale premio annuo", "Ribasso", "Tasse legali", "Semestrale",
  ],
});
assert.ok(
  motorPremiumHints.ruleIds.includes("ch-verified-motor-final-premium-2026"),
  "final annual vehicle premium interpretation must reach the extraction context"
);
const familyHealthHints = getSwissInsuranceKnowledgeHints({
  policyTypeGuess: "health",
  extractedTextSignals: [
    "Helsana", "Panoramica dei premi", "Assicurazione integrativa",
    "Totale premio mensile",
  ],
});
assert.ok(
  familyHealthHints.ruleIds.includes("ch-verified-helsana-multiperson-overview-2026"),
  "family health document disambiguation must reach the extraction context"
);

// Authoritative PDF pointers are multilingual, edition-specific, and do not
// copy insurer clauses into the repository.
assert.equal(swissCgaPdfSources.length, 30);
assert.equal(new Set(swissCgaPdfSources.map((entry) => entry.url)).size, 30);
for (const language of ["it", "de", "fr"] as const) {
  assert.equal(swissCgaPdfSources.filter((entry) => entry.language === language).length, 10);
}
assert.ok(swissMultilingualCgaConcepts.length >= 6);
assert.ok(swissCgaPdfSources.some((entry) => entry.product === "business-salary-lca" && entry.editionFrom === "2026-05-01"));
assert.ok(swissCgaPdfSources.some((entry) => entry.product === "dental-cga" && entry.editionFrom === "2027-01-01"));
assert.deepEqual(
  findSwissCgaSourceCandidates({
    insurer: "CSS", product: "myflex-cga", language: "it",
    contractEffectiveOn: "2026-08-01"
  }).map((entry) => entry.editionFrom),
  ["2026-01-01"],
  "future 2027 general conditions must NOT be preferred for a 2026 contract"
);
assert.deepEqual(
  findSwissCgaSourceCandidates({
    insurer: "AXA", product: "motor-optima-flex", language: "fr",
    contractEffectiveOn: "2025-01-01"
  }),
  [],
  "a 2025-10 AXA CGA is not valid evidence for a January 2025 personal policy"
);

const multiGerman = getMultilingualCgaInterpretationHints(
  "Motorfahrzeugversicherung Jahresprämie CHF 1'815.00 Zahlungsweise halbjährlich. Nicht versichert: Pannenhilfe.",
  "car", 6
);
assert.ok(multiGerman.ruleIds.includes("ch-cga-motor-premium-multilingual-001"));
assert.ok(multiGerman.ruleIds.includes("ch-cga-motor-exclusions-multilingual-001"));
const multiFrench = getMultilingualCgaInterpretationHints(
  "Aperçu des primes. Total des primes mensuelles CHF 635.00. Personne assurée A: assurance de base et complémentaire.",
  "health", 6
);
assert.ok(multiFrench.ruleIds.includes("ch-cga-health-family-premium-multilingual-001"));
const multiItalian = getMultilingualCgaInterpretationHints(
  "Polizza LAMal: franchigia annua CHF 300 e aliquota percentuale 10%.",
  "health", 6
);
assert.ok(multiItalian.ruleIds.includes("ch-cga-health-franchise-multilingual-001"));

const travelGerman = getMultilingualCgaInterpretationHints(
  "Reiseversicherung: Annullierungskosten und Reisegepäck, optionale Module.",
  "other", 9
);
assert.ok(travelGerman.ruleIds.includes("ch-cga-travel-modules-multilingual-001"));
const dentalFrench = getMultilingualCgaInterpretationHints(
  "Assurance soins dentaires. Participation aux coûts et limite annuelle.",
  "health", 9
);
assert.ok(dentalFrench.ruleIds.includes("ch-cga-dental-insurance-multilingual-001"));
const salaryItalian = getMultilingualCgaInterpretationHints(
  "Assicurazione collettiva indennità giornaliera LCA con salario assicurato e periodo d'attesa.",
  "other", 9
);
assert.ok(salaryItalian.ruleIds.includes("ch-cga-daily-sickness-multilingual-001"));

const multilingualMotorContext = buildExtractionKnowledgeContext(
  "motor-versicherungsbedingungen-test.pdf",
  "Versicherung Motorfahrzeug Haftpflicht. Jahresprämie CHF 1815. Zahlungsmode halbjährlich. Nicht versichert: Pannenhilfe."
);
assert.ok(multilingualMotorContext.ruleIds.some((id) => id.startsWith("ch-cga-")),
  "translated policy must pass multilingual knowledge to the real extraction prompt"
);
const multilingualHealthContext = buildExtractionKnowledgeContext(
  "assurance-maladie-test.pdf",
  "Assurance de base LAMal et complémentaire LCA. Franchise annuelle CHF 300. Aperçu des primes. Total des primes mensuelles CHF 635."
);
assert.ok(multilingualHealthContext.ruleIds.some((id) => id.startsWith("ch-cga-")),
  "French language input must pass multilingual knowledge to the model"
);

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

const indexedTrilingualProducts = ["motor-optima-flex", "motor", "health-supplementary-cga", "myflex-cga"];
for (const product of indexedTrilingualProducts) {
  const variants = swissCgaPdfSources.filter((item) => item.product === product);
  assert.deepEqual([...new Set(variants.map((item) => item.language))].sort(), ["de", "fr", "it"]);
}
assert.equal(swissCgaPdfSources.length, 21);
assert.ok(swissCgaPdfSources.every((item) => item.url.startsWith("https://")));
assert.ok(!findSwissCgaSourceCandidates({ insurer: "css", product: "myflex-cga", contractEffectiveOn: "2026-06-01" }).some((item) => item.editionFrom === "2027-01-01"));
assert.ok(findSwissCgaSourceCandidates({ insurer: "css", product: "myflex-cga", language: "fr", contractEffectiveOn: "2027-02-01" }).some((item) => item.editionFrom === "2027-01-01"));
