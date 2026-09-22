import assert from "node:assert/strict";
import { recognizeSwissInsurer } from "../lib/insurance-knowledge/insurer-registry";

function expectId(text: string, id: string) {
  const r = recognizeSwissInsurer(text);
  assert.equal(r.insurerId, id, `${text} → ${r.insurerId}`);
}

expectId("Zurich Insurance Company Ltd", "zurich");
expectId("Zurigo Compagnia di Assicurazioni", "zurich");
expectId("La Mobiliare", "mobiliar");
expectId("Die Mobiliar", "mobiliar");
expectId("AXA Versicherungen AG", "axa");
expectId("Baloise", "baloise");
expectId("Basler", "baloise");

console.log("insurer-canonical.test.ts OK");
