import assert from "node:assert/strict";
import { findExplicitSwissPremiumTotal } from "../lib/insurance-knowledge/premium-evidence";
import { getPolicyAnnualPremium, sumPortfolioPremiums } from "../lib/premium-totals";
import type { UserPolicy } from "../lib/types";

const kpt = ["KPT ESEMPIO DIDATTICO / NON VALIDO", "Totale mensile LAMal     535.10",
  "Totale premio mensile LCA     32.25", "Totale mensile LAMal + LCA     567.35"].join("\n");
assert.deepEqual(findExplicitSwissPremiumTotal(kpt), {amount:567.35,frequency:"monthly",sourceLabel:"Totale mensile LAMal + LCA"});
assert.deepEqual(findExplicitSwissPremiumTotal("Totale mensile LAMal + LCA\\n567.35"), {
  amount: 567.35, frequency: "monthly", sourceLabel: "Totale mensile LAMal + LCA",
});
assert.equal(findExplicitSwissPremiumTotal("Totale premio mensile\\nCHF 863.55")?.amount, 863.55);
assert.equal(findExplicitSwissPremiumTotal("Totale premio mensile CHF 863.55")?.amount, 863.55);
assert.deepEqual(findExplicitSwissPremiumTotal("Totale premio annuo: CHF 864.00"), {amount:864,frequency:"annual",sourceLabel:"Totale premio annuo"});
assert.equal(findExplicitSwissPremiumTotal("Premio di listino CHF 25.00\nSconto CHF -5.00"), null);
assert.equal(findExplicitSwissPremiumTotal("Totale premio mensile CHF 99.00\nTotale premio mensile CHF 199.00"), null);
const free = {premiumAmount:0,premiumFrequency:"monthly",details:{}} as UserPolicy;
const paid = {premiumAmount:20,premiumFrequency:"monthly",details:{}} as UserPolicy;
assert.equal(getPolicyAnnualPremium(free), 0);
assert.deepEqual(sumPortfolioPremiums([free]), {annual:0,monthly:0});
assert.deepEqual(sumPortfolioPremiums([free,paid]), {annual:240,monthly:20});
console.info("PASS pilot premium evidence");
