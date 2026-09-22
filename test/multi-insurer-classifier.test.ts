import assert from "node:assert/strict";
import {
  canPersistAsPersonalPolicy,
  classifyInsuranceDocument,
  recognizeSwissInsurer,
} from "../lib/insurance-knowledge";

type Case = {
  name: string;
  expectedType: "policy" | "general_conditions";
  expectedInsurer?: string;
  text: string;
};

const cases: Case[] = [
  {
    name: "Zurich motor personal (IT)",
    expectedType: "policy",
    expectedInsurer: "Zurich",
    text: `
La mia assicurazione auto
Zurich Compagnia di Assicurazioni SA
Polizza n. 11.222.333
Contraente Signor Mario Rossi, via Example 1, 6900 Lugano
Inizio contratto 01.01.2025 Scadenza 31.12.2031
Modalità di pagamento Semestrale
Numero di targa TI 111222
Veicolo VOLVO XC60
Totale premio annuo (incl. tasse e imposte) CHF 1'200.00
Responsabilità civile 400.00
Collisione (Casco totale) 500.00
Casco parziale 300.00
Alla base dell'assicurazione vi sono allegate le Condizioni generali di assicurazione (CGA).
`,
  },
  {
    name: "AXA motor personal (IT)",
    expectedType: "policy",
    expectedInsurer: "AXA",
    text: `
AXA Assicurazioni SA
Polizza n. AX-998877
Contraente Signora Anna Bianchi, 8001 Zürich
Inizio 01.06.2025 Scadenza 31.05.2026
Zahlungsweise / Modalità di pagamento: Annuale
Targa ZH 123456
Veicolo BMW 320d
Totale premio annuo CHF 980.50
Responsabilità civile inclusa
Casco parziale inclusa
Condizioni generali di assicurazione (CGA) Assicurazione veicoli a motore edizione 10.2021
`,
  },
  {
    name: "Allianz motor personal (IT)",
    expectedType: "policy",
    expectedInsurer: "Allianz Suisse",
    text: `
Allianz Suisse Società di Assicurazioni SA
Polizza nr. AS-445566
Contraente Luca Verdi, Bern
Inizio contratto 01.03.2025 Scadenza 28.02.2026
Modalità di pagamento Trimestrale
Numero di targa BE 654321
Veicolo AUDI A3
Premio annuo CHF 1'050.00
Responsabilità civile / Haftpflicht
Vollkasko / Casco totale
`,
  },
  {
    name: "Helvetia motor personal (DE)",
    expectedType: "policy",
    expectedInsurer: "Helvetia",
    text: `
Helvetia Schweizerische Versicherungsgesellschaft AG
Meine Versicherung
Policennummer HV-778899
Versicherungsnehmer Max Muster, 9000 St. Gallen
Vertragsbeginn 01.04.2025 Hauptfälligkeit 31.03.2026
Zahlungsweise Halbjährlich
Kontrollschild SG 112233
Fahrzeug VW Golf
Jahresprämie CHF 890.00
Haftpflicht
Teilkasko
Allgemeine Versicherungsbedingungen (AVB) Motorfahrzeugversicherung
`,
  },
  {
    name: "Mobiliar motor personal (IT)",
    expectedType: "policy",
    expectedInsurer: "La Mobiliare",
    text: `
La Mobiliare / Schweizerische Mobiliar Versicherungsgesellschaft AG
Polizza n. MB-334455
Contraente Giulia Neri, 6500 Bellinzona
Inizio 01.02.2025 Scadenza 31.01.2026
Modalità di pagamento Semestrale
Targa TI 778899
Veicolo TOYOTA Yaris
Totale premio annuo CHF 760.00
Responsabilità civile
Casco parziale
`,
  },
  {
    name: "Baloise motor personal (FR)",
    expectedType: "policy",
    expectedInsurer: "Baloise",
    text: `
Baloise Assurance SA
Police d'assurance n° BA-556677
Preneur d'assurance Jean Dupont, 1003 Lausanne
Début 01.05.2025 Échéance 30.04.2026
Mode de paiement Semestriel
Plaque VD 445566
Véhicule PEUGEOT 308
Prime annuelle CHF 920.00
Responsabilité civile
Casco partielle
Conditions générales d'assurance
`,
  },
  {
    name: "AXA pure CGA (IT)",
    expectedType: "general_conditions",
    text: `
Condizioni Generali di Assicurazione (CGA)
Assicurazione veicoli a motore
Edizione 10.2021
Articolo 1 Disposizioni comuni
Le presenti condizioni generali si applicano a tutti i contratti.
Definizioni e prestazioni standard. Nessun premio individuale.
`,
  },
  {
    name: "Household personal (FR)",
    expectedType: "policy",
    text: `
Police d'assurance ménage
Numéro de police HH-889900
Preneur d'assurance Marie Lefevre, Genève
Début 01.01.2025 Échéance 31.12.2025
Prime annuelle CHF 340.00
Inventaire du ménage CHF 80'000
Franchise CHF 200
`,
  },
  {
    name: "Private liability personal (DE)",
    expectedType: "policy",
    text: `
Privathaftpflichtversicherung
Policennummer PH-112233
Versicherungsnehmer Anna Schmidt, Basel
Vertragsbeginn 01.07.2025 Hauptfälligkeit 30.06.2026
Jahresprämie CHF 180.00
Versicherungssumme CHF 10'000'000
Selbstbehalt CHF 200
`,
  },
];

for (const testCase of cases) {
  const classification = classifyInsuranceDocument(testCase.text);
  assert.equal(
    classification.type,
    testCase.expectedType,
    `${testCase.name}: expected ${testCase.expectedType}, got ${classification.type}`
  );
  if (testCase.expectedType === "policy") {
    assert.equal(canPersistAsPersonalPolicy(classification.type), true, testCase.name);
  } else {
    assert.equal(canPersistAsPersonalPolicy(classification.type), false, testCase.name);
  }
  if (testCase.expectedInsurer) {
    const insurer = recognizeSwissInsurer(testCase.text);
    assert.equal(insurer.brand, testCase.expectedInsurer, `${testCase.name} insurer`);
  }
}

console.info(`PASS multi-insurer classifier (${cases.length} cases)`);
