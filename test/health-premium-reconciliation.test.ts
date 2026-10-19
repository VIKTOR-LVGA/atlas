import assert from "node:assert/strict";
import {
  enrichHealthCoverageEvidence,
  extractItalianHealthPremiumOverview,
  reconcileHealthPremiumOverview,
} from "../lib/health-premium-reconciliation";

const reversedPdfText = `
Totale premio mensile CHF 863.55
T o t a l e
169.05
Assicurazione integrativa 42.40
Assicurazione di base 126.65
Melanie Muster, 29.07.2012, n. d'assicurato 100 452 958
T o t a l e
353.80
Assicurazione integrativa 61.05
Assicurazione di base 292.75
Isabella Muster, 29.12.1983, n. d'assicurato 100 452 957
T o t a l e
340.70
Assicurazione integrativa 52.85
Assicurazione di base 287.85
Charles Muster, 22.12.1984, n. d'assicurato 100 452 956
Panoramica dei premi
`;

const rows = extractItalianHealthPremiumOverview(reversedPdfText);
assert.equal(rows.length, 3);
assert.deepEqual(
  rows.map((row) => [row.name, row.total]),
  [
    ["Melanie Muster", 169.05],
    ["Isabella Muster", 353.8],
    ["Charles Muster", 340.7],
  ]
);

const reconciled = reconcileHealthPremiumOverview(
  {
    insured_people: [
      { name: "Charles Muster", insured_number: "100 452 956", total_monthly_premium: 340.7 },
      { name: "Isabella Muster", insured_number: "100 452 957", total_monthly_premium: 353.8 },
      { name: "Melanie Muster", insured_number: "100 452 958", total_monthly_premium: 353.8 },
    ],
  },
  reversedPdfText,
  863.55
);

assert.deepEqual(
  reconciled.insured_people?.map((person) => person.total_monthly_premium),
  [340.7, 353.8, 169.05]
);
assert.deepEqual(
  reconciled.insured_people?.map((person) => person.base_premium),
  [287.85, 292.75, 126.65]
);

const withEvidence = enrichHealthCoverageEvidence(
  {
    coverages: [
      {
        name: "Assicurazione di base",
        original_label: "Assicurazione di base",
        source_page: 1,
      },
    ],
  },
  reversedPdfText
);
assert.equal(withEvidence.coverages?.[0].evidence, "Assicurazione di base 126.65");

console.info("PASS health premium overview deterministic reconciliation");
