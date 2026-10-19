import assert from "node:assert/strict";
import { normalizeCoverageLabel, annualizePremium } from "../lib/insurance-knowledge/normalization";

assert.equal(normalizeCoverageLabel("").canonicalType, null);
assert.equal(normalizeCoverageLabel(" ").confidence, 0);
assert.equal(normalizeCoverageLabel("x").canonicalType, null);
assert.equal(annualizePremium(864, "annual"), 864);
assert.equal(annualizePremium(864, null), null);
console.log("ATLAS normalization safeguards passed");
