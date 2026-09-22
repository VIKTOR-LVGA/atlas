import assert from "node:assert/strict";
import {
  ageBandFromBirthDate,
  annualizePremium,
  coveragePenetration,
  gateSample,
  getIntelligenceMinCohortSize,
  isConfirmedSwitch,
  meetsCohortThreshold,
  netObservedSwitching,
  percentile,
  premiumDistribution,
  suppressBelowThreshold,
} from "../lib/intelligence/privacy";

const k = getIntelligenceMinCohortSize();

// --- Privacy threshold ---
assert.equal(meetsCohortThreshold(19), false);
assert.equal(meetsCohortThreshold(20), true);
assert.equal(gateSample(19).status, "insufficient_sample");
assert.equal(gateSample(20).status, "ok");
assert.equal(gateSample(25).status, "ok");
// filter reduces cohort
assert.equal(gateSample(8).status, "insufficient_sample");
assert.equal(suppressBelowThreshold(4, 4), null);
assert.equal(suppressBelowThreshold(35, 35), 35);
assert.equal(suppressBelowThreshold(35, 19), null);

// --- Age bands ---
assert.equal(ageBandFromBirthDate("2005-01-15", new Date("2026-09-22")), "18-24");
assert.equal(ageBandFromBirthDate("1995-06-01", new Date("2026-09-22")), "25-34");
assert.equal(ageBandFromBirthDate("1950-01-01", new Date("2026-09-22")), "65+");
assert.equal(ageBandFromBirthDate(null), null);

// --- Premium annualization ---
assert.equal(annualizePremium(100, "monthly"), 1200);
assert.equal(annualizePremium(300, "quarterly"), 1200);
assert.equal(annualizePremium(600, "semiannual"), 1200);
assert.equal(annualizePremium(1200, "annual"), 1200);
assert.equal(annualizePremium(100, "weird"), null);
assert.equal(annualizePremium(-1, "monthly"), null);
assert.equal(annualizePremium(null, "monthly"), null);

// --- Percentiles ---
const dist = premiumDistribution([980, 1240, 1580, 1100, 1300]);
assert.equal(dist.n, 5);
assert.ok(dist.median != null && dist.median >= 1100 && dist.median <= 1300);
assert.ok(dist.p25 != null);
assert.ok(dist.p75 != null);
assert.equal(percentile([10], 50), 10);
assert.equal(percentile([], 50), null);

// --- Switching ---
assert.equal(
  isConfirmedSwitch({ fromInsurer: "Zurich", toInsurer: "AXA", source: "broker_confirmed" }),
  true
);
assert.equal(
  isConfirmedSwitch({ fromInsurer: "Zurich", toInsurer: "Zurich", source: "broker_confirmed" }),
  false
);
assert.equal(
  isConfirmedSwitch({ fromInsurer: "Zurich", toInsurer: "AXA", source: "guess" }),
  false
);
assert.equal(netObservedSwitching(40, 12), 28);

// --- Coverage ---
const pen = coveragePenetration({ included: 62, excluded: 38, unknown: 50 });
assert.equal(pen.knownDenominator, 100);
assert.ok(pen.penetrationPct != null && Math.abs(pen.penetrationPct - 62) < 0.01);
const penUnknownOnly = coveragePenetration({ included: 0, excluded: 0, unknown: 50 });
assert.equal(penUnknownOnly.penetrationPct, null);

console.log(`intelligence-privacy.test.ts OK (k=${k})`);
