import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { recoverSwissMotorPolicyFields } from "../lib/motor-policy-recovery";

const fixture = readFileSync(
  resolve(process.cwd(), "test/fixtures/insurance-knowledge/zurich-motor-personal-policy-it.txt"),
  "utf8"
);

const recovered = recoverSwissMotorPolicyFields(fixture);

assert.equal(recovered.vehicleMake, "MERCEDES-BENZ");
assert.ok(recovered.vehicleModel && /C\s*220d/i.test(recovered.vehicleModel));
assert.ok(recovered.licensePlate && /TI\s*100200/i.test(recovered.licensePlate));
assert.equal(recovered.annualGrossPremium, 1873.1);
assert.ok(
  recovered.coverages.some(
    (c) => c.canonical_type === "motor_liability" && c.coverage_status === "included"
  )
);
assert.ok(
  recovered.coverages.some(
    (c) =>
      (c.canonical_type === "occupants_accident" || /infortunio/i.test(c.name)) &&
      c.coverage_status === "excluded"
  )
);
assert.ok(
  recovered.coverages.some(
    (c) =>
      (c.canonical_type === "roadside_assistance" || /soccorso/i.test(c.name)) &&
      c.coverage_status === "excluded"
  )
);

console.info("PASS Swiss motor recovery from anonymized Zurich fixture");
