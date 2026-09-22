import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  classifyInsuranceDocument,
  getCanonicalCoverageDefinition,
  recognizeSwissInsurer,
  scorePersonalContractSignals,
} from "../lib/insurance-knowledge";

const fixture = readFileSync(
  resolve(process.cwd(), "test/fixtures/insurance-knowledge/zurich-motor-personal-policy-it.txt"),
  "utf8"
);

const classification = classifyInsuranceDocument(fixture);
const personal = scorePersonalContractSignals(fixture);
const insurer = recognizeSwissInsurer(fixture);

assert.equal(classification.type, "policy");
assert.equal(insurer.brand, "Zurich");
assert.ok(personal.score >= 8);

// Structural expectations for Zurich-like Swiss motor policies (anonymized fixture).
const expectations: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /polizza\s*n/i, label: "policy number label" },
  { pattern: /mercede?s[-\s]?benz/i, label: "vehicle make" },
  { pattern: /c\s*220d/i, label: "vehicle model" },
  { pattern: /targa|ti\s*\d{5,}/i, label: "plate" },
  { pattern: /1[''′]?873\.10|1873\.10/i, label: "annual gross premium" },
  { pattern: /responsabilit[aà]\s+civile/i, label: "RC" },
  { pattern: /collisione|casco\s+totale/i, label: "collision" },
  { pattern: /casco\s+parziale/i, label: "partial casco" },
  { pattern: /parcheggio/i, label: "parking" },
  { pattern: /01\.01\.2025|01\/01\/2025/i, label: "start" },
  { pattern: /31\.12\.2031|31\/12\/2031/i, label: "end" },
  { pattern: /semestrale/i, label: "payment frequency" },
];

for (const { pattern, label } of expectations) {
  assert.ok(pattern.test(fixture), `fixture missing ${label}`);
}

assert.ok(getCanonicalCoverageDefinition("motor_liability"));
assert.ok(getCanonicalCoverageDefinition("collision_damage"));
assert.ok(getCanonicalCoverageDefinition("partial_casco"));
assert.ok(getCanonicalCoverageDefinition("parking_damage"));
assert.ok(getCanonicalCoverageDefinition("occupants_accident"));

console.info("PASS Zurich motor extraction structure regression (anonymized)");
