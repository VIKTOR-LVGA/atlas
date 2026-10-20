import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Sample = {
  id: string; insurer: string; language: string; kind: string; url: string;
  pages: number; monthlyTotalChf: number; effectiveOn: string;
  insuredMonthlyChf?: number[]; firstInsured?: {
    lamalNetChf: number; lcaNetChf: number;
    lamalBeforeEnvironmentalRefundChf: number; environmentalRefundChf: number;
    deductibleChf: number; accidentIncludedInLamal: boolean;
  };
  lamalMonthlyChf?: number; lcaMonthlyChf?: number;
  lamalBaseBeforeAdjustmentsChf?: number; accidentSupplementChf?: number;
  environmentalRefundChf?: number; deductibleChf?: number;
  sameScenarioAs?: string;
};
const data = JSON.parse(readFileSync(resolve(process.cwd(),
  "test/fixtures/insurance-knowledge/official-sample-policy-ground-truth.json"), "utf8")) as {documents:Sample[]};
const money = (n: number) => Math.round(n * 100);
assert.equal(data.documents.length, 3);
assert.equal(new Set(data.documents.map(d => d.id)).size, 3);
for (const d of data.documents) {
  assert.ok(d.url.startsWith("https://"));
  assert.ok(d.pages > 0);
  assert.ok(["official_sample", "official_facsimile"].includes(d.kind));
}
for (const d of data.documents.filter(d => d.insurer === "helsana")) {
  assert.equal(money(d.insuredMonthlyChf!.reduce((a,b) => a+b,0)), money(d.monthlyTotalChf));
  const person = d.firstInsured;
  if (person) {
    assert.equal(money(person.lamalNetChf + person.lcaNetChf), money(d.insuredMonthlyChf![0]));
    assert.equal(money(person.lamalBeforeEnvironmentalRefundChf - person.environmentalRefundChf), money(person.lamalNetChf));
  }
}
const kpt = data.documents.find(d => d.insurer === "kpt")!;
assert.equal(money(kpt.lamalMonthlyChf! + kpt.lcaMonthlyChf!), money(kpt.monthlyTotalChf));
assert.equal(money(kpt.lamalBaseBeforeAdjustmentsChf! + kpt.accidentSupplementChf! - kpt.environmentalRefundChf!), money(kpt.lamalMonthlyChf!));
assert.equal(kpt.deductibleChf, 2500);
assert.equal(data.documents.find(d => d.language === "fr")!.sameScenarioAs, "helsana-sample-2024-it");
console.log("Official sample policy ground-truth arithmetic checks passed.");
