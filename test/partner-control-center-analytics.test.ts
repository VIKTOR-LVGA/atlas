import assert from "node:assert/strict";
import test from "node:test";
import { applyPartnerGeoPrivacy, type CantonAggregate } from "../lib/partner-geo-privacy";
import { dropOff, pct, safeNumber } from "../lib/analytics-period";
import { PARTNER_GEO_PRIVACY_THRESHOLD, SWISS_CANTON_CODES, cantonLabel } from "../lib/swiss-cantons";

test("swiss cantons include TI ZH VD GE", () => {
  for (const code of ["TI", "ZH", "VD", "GE"] as const) {
    assert.ok(SWISS_CANTON_CODES.includes(code));
    assert.notEqual(cantonLabel(code), "Non disponibile");
  }
  assert.equal(cantonLabel("UNKNOWN"), "Non disponibile");
  assert.equal(cantonLabel(null), "Non disponibile");
});

test("partner geo privacy masks revenue under threshold", () => {
  assert.equal(PARTNER_GEO_PRIVACY_THRESHOLD, 3);
  const rows: CantonAggregate[] = [
    {
      canton: "TI",
      leads: 2,
      clients: 2,
      contracts: 1,
      brokerRevenue: 100,
      grossCommission: 200,
      atlasRevenue: 80,
    },
    {
      canton: "ZH",
      leads: 5,
      clients: 5,
      contracts: 2,
      brokerRevenue: 500,
      grossCommission: 900,
      atlasRevenue: 400,
    },
    {
      canton: "UNKNOWN",
      leads: 1,
      clients: 1,
      contracts: 0,
      brokerRevenue: 10,
      grossCommission: 10,
      atlasRevenue: 0,
    },
  ];
  const masked = applyPartnerGeoPrivacy(rows);
  assert.equal(masked[0].privacyMasked, true);
  assert.equal(masked[0].brokerRevenue, 0);
  assert.equal(masked[1].privacyMasked, undefined);
  assert.equal(masked[1].brokerRevenue, 500);
  assert.equal(masked[2].privacyMasked, undefined);
});

test("analytics helpers avoid NaN", () => {
  assert.equal(pct(1, 0), 0);
  assert.equal(pct(Number.NaN, 10), 0);
  assert.equal(dropOff(0, 5), 0);
  assert.equal(safeNumber(undefined), 0);
  assert.equal(safeNumber("12.5"), 12.5);
});
