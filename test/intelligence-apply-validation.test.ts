import assert from "node:assert/strict";
import { validateIntelligenceApplication } from "../lib/intelligence/apply-validation";

const emptyDraft = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  website: "",
  reason: "",
  modules: [] as string[],
  consent: false,
  isAuthenticated: false,
  password: "",
  confirmPassword: "",
};

const allErrors = validateIntelligenceApplication(emptyDraft);
assert.deepEqual(Object.keys(allErrors).sort(), [
  "companyName",
  "confirmPassword",
  "consent",
  "email",
  "firstName",
  "lastName",
  "modules",
  "password",
  "reason",
]);

const invalidWebsite = validateIntelligenceApplication({
  ...emptyDraft,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  companyName: "Analytical Engines AG",
  website: "javascript:alert(1)",
  reason: "Valutare benchmark aggregati per il mercato svizzero.",
  modules: ["market_overview"],
  consent: true,
  password: "correct-horse",
  confirmPassword: "correct-horse",
});
assert.deepEqual(invalidWebsite, {
  website: "Inserisci un indirizzo web che inizi con http:// o https://.",
});

const authenticatedValid = validateIntelligenceApplication({
  ...emptyDraft,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  companyName: "Analytical Engines AG",
  website: "https://example.com",
  reason: "Valutare benchmark aggregati per il mercato svizzero.",
  modules: ["market_overview"],
  consent: true,
  isAuthenticated: true,
});
assert.deepEqual(authenticatedValid, {});

console.log("intelligence-apply-validation:ok");
