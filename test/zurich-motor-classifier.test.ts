import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canPersistAsPersonalPolicy,
  classifyInsuranceDocument,
  scorePersonalContractSignals,
} from "../lib/insurance-knowledge";

const fixtureRoot = resolve(process.cwd(), "test/fixtures/insurance-knowledge");
const fixture = (name: string) => readFileSync(resolve(fixtureRoot, name), "utf8");

const zurichLike = fixture("zurich-motor-personal-policy-it.txt");
const classification = classifyInsuranceDocument(zurichLike);
const personal = scorePersonalContractSignals(zurichLike);

assert.equal(classification.type, "policy", "Zurich-like motor policy must be personal policy");
assert.equal(canPersistAsPersonalPolicy(classification.type), true);
assert.ok(personal.score >= 8, `personal score too low: ${personal.score}`);
assert.equal(
  classification.embeddedGeneralConditionsReference,
  true,
  "must detect attached CGA reference without becoming CGA"
);
assert.ok(
  /policy_number|premium|license_plate|insured_vehicle/.test(
    (classification.reasoningSignals ?? []).join(" ")
  ) || personal.evidence.includes("policy_number"),
  "must keep contract evidence"
);

// Explicit CGA citation must not flip classification.
const withStrongCgaCite = `${zurichLike}\n\nAlla base dell'assicurazione vi sono allegate le Condizioni generali di assicurazione (CGA) Assicurazione di veicoli a motore, edizione 11.2021.`;
const cited = classifyInsuranceDocument(withStrongCgaCite);
assert.equal(cited.type, "policy", "CGA citation inside personal policy must remain policy");

const pureCga = classifyInsuranceDocument(fixture("axa-auto-cga-it.txt"));
assert.equal(pureCga.type, "general_conditions");
assert.equal(canPersistAsPersonalPolicy(pureCga.type), false);

// Structural Swiss motor signals without Zurich-specific IDs.
const genericMotor = `
La mia assicurazione auto
Polizza n. 55.111.222
Contraente Signor Luca Bianchi
via Roma 10 6900 Lugano
Inizio: 01.03.2025
Scadenza: 28.02.2026
Modalità di pagamento: Semestrale
Numero di targa: TI 555666
Veicolo: AUDI A4 Avant
Totale premio annuo (incl. tasse e imposte) CHF 1'250.00
Responsabilità civile 400.00
Casco parziale 500.00
Collisione (Casco totale) 350.00
Alla base dell'assicurazione vi sono allegate le Condizioni generali di assicurazione (CGA).
`;
const generic = classifyInsuranceDocument(genericMotor);
assert.equal(generic.type, "policy", "generic Swiss motor personal policy");

console.info("PASS Zurich motor personal-policy classifier regression");
