import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime } from "../lib/utils.ts";

function inHostTimeZones(check) {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Europe/Zurich", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      check(zone);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
}

test("upload dates stay on the same Swiss calendar day during hydration", () => {
  inHostTimeZones((zone) => {
    assert.equal(formatDate("2026-10-19T22:10:00Z"), "20 ott 2026", zone);
  });
});

test("date and time use Swiss daylight-saving time on every host", () => {
  inHostTimeZones((zone) => {
    assert.match(formatDateTime("2026-10-19T22:10:00Z"), /20 ott 2026.*00:10/, zone);
  });
});

test("winter timestamps use Swiss standard time on every host", () => {
  inHostTimeZones((zone) => {
    assert.match(formatDateTime("2026-12-31T23:10:00Z"), /1 gen 2027.*00:10/, zone);
  });
});

test("date-only policy dates keep their contract day", () => {
  inHostTimeZones((zone) => {
    assert.equal(formatDate("2026-12-31"), "31 dic 2026", zone);
  });
});
