import assert from "node:assert/strict";
import { comparePolicyToOffer, comparisonStateLabel } from "../lib/offer-comparison";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

run("same premium", () => {
  const result = comparePolicyToOffer({
    currentPremium: 1000,
    currentFrequency: "annual",
    offerPremium: 1000,
    offerFrequency: "annual",
  });
  assert.equal(result.annualPremiumDelta, 0);
  assert.ok(result.badges.includes("Premio invariato"));
});

run("lower premium", () => {
  const result = comparePolicyToOffer({
    currentPremium: 1873.1,
    currentFrequency: "annual",
    offerPremium: 1640,
    offerFrequency: "annual",
  });
  assert.ok(Math.abs((result.annualPremiumDelta ?? 0) + 233.1) < 0.05);
  assert.ok(result.badges.includes("Più economica"));
  assert.ok(result.summaryLines[0].includes("in meno"));
  assert.ok(!/migliore/i.test(result.summaryLines.join(" ")));
});

run("higher premium", () => {
  const result = comparePolicyToOffer({
    currentPremium: 1000,
    currentFrequency: "annual",
    offerPremium: 1200,
    offerFrequency: "annual",
  });
  assert.ok(result.badges.includes("Premio più alto"));
});

run("monthly vs annual normalize", () => {
  const result = comparePolicyToOffer({
    currentPremium: 100,
    currentFrequency: "monthly",
    offerPremium: 1100,
    offerFrequency: "annual",
  });
  assert.ok(Math.abs((result.annualPremiumDelta ?? 0) + 100) < 0.05);
});

run("unknown frequency not comparable", () => {
  const result = comparePolicyToOffer({
    currentPremium: 100,
    currentFrequency: "weird",
    offerPremium: 1000,
    offerFrequency: "annual",
  });
  assert.equal(
    result.items.find((i) => i.key === "annual_premium")?.state,
    "not_comparable"
  );
});

run("added and removed coverages", () => {
  const result = comparePolicyToOffer({
    currentCoverages: [
      { code: "rc", label: "Responsabilità civile" },
      { code: "parking", label: "Parking" },
    ],
    offerCoverages: [
      { code: "rc", label: "Responsabilità civile" },
      { code: "roadside", label: "Roadside" },
    ],
  });
  assert.ok(result.badges.includes("Copertura aggiunta"));
  assert.ok(result.badges.includes("Copertura rimossa"));
});

run("deductible change on coverage", () => {
  const result = comparePolicyToOffer({
    currentCoverages: [{ code: "collision", label: "Collision", deductible: 1000 }],
    offerCoverages: [{ code: "collision", label: "Collision", deductible: 1500 }],
  });
  const row = result.items.find((i) => i.key === "cov_collision");
  assert.equal(row?.state, "worse_objectively_on_this_field");
});

run("missing premium", () => {
  const result = comparePolicyToOffer({});
  assert.ok(result.badges.includes("Dati incompleti"));
  assert.equal(result.items[0].state, "unknown");
});

run("unknown conditions", () => {
  const result = comparePolicyToOffer({
    conditions: [{ key: "territory", label: "Territorio", current: null, offer: null }],
  });
  assert.equal(result.items[0].state, "unknown");
  assert.match(comparisonStateLabel("not_comparable"), /Non confrontabile/);
});

run("global deductibles", () => {
  assert.ok(
    comparePolicyToOffer({ currentDeductible: 1000, offerDeductible: 500 }).badges.includes(
      "Franchigia più bassa"
    )
  );
  assert.ok(
    comparePolicyToOffer({ currentDeductible: 500, offerDeductible: 1000 }).badges.includes(
      "Franchigia più alta"
    )
  );
});

run("multi-age deductible structure not collapsed", () => {
  const result = comparePolicyToOffer({
    conditions: [
      {
        key: "ded_age",
        label: "Franchigia per età",
        current: ">=25: CHF 1'000 · <25: CHF 3'000",
        offer: "CHF 1'500",
      },
    ],
  });
  const row = result.items.find((i) => i.key === "ded_age");
  assert.equal(row?.state, "different");
  assert.match(String(row?.current), /25/);
  assert.match(String(row?.offer), /1/);
});

console.log("offer-comparison: all assertions passed");
