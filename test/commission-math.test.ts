import assert from "node:assert/strict";
import { centsToMoney, moneyToCents, splitAdjustment, splitCommission } from "../lib/commission-math";

assert.equal(moneyToCents("999.95"), BigInt(99995));
assert.equal(centsToMoney(BigInt(-25000)), "-250.00");
assert.deepEqual(splitCommission("1000.00", "40"), { gross: "1000.00", atlas: "400.00", broker: "600.00" });
assert.deepEqual(splitCommission("999.95", "40"), { gross: "999.95", atlas: "399.98", broker: "599.97" });
assert.deepEqual(splitCommission("0.01", "50"), { gross: "0.01", atlas: "0.01", broker: "0.00" });
assert.deepEqual(splitAdjustment("-250", { gross: "1000", atlas: "400" }), { amount: "-250.00", atlas: "-100.00", broker: "-150.00", other: "0.00" });
assert.deepEqual(splitAdjustment("-1000", { gross: "1000", atlas: "400" }), { amount: "-1000.00", atlas: "-400.00", broker: "-600.00", other: "0.00" });
assert.deepEqual(splitAdjustment("75.01", { gross: "999.95", atlas: "399.98" }), { amount: "75.01", atlas: "30.00", broker: "45.01", other: "0.00" });
assert.throws(() => splitCommission("-1", "40"), /non-negative/);
assert.throws(() => splitCommission("100", "101"), /range/);
assert.throws(() => splitAdjustment("10", { gross: "0", atlas: "0" }), /Zero/);

console.log("commission math: 11 checks passed");
