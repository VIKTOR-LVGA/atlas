# ATLAS: official CGA sources and IT/DE/FR interpretation (2026-10-20)

This is a **verified first batch**, not all CGA issued by all Swiss insurers.
The direct insurer-PDF records are stored as structured metadata in
`lib/insurance-knowledge/cga-pdf-sources.ts`. The actual PDFs stay with the
publishers: this repository does **not** mirror entire licensed/legal texts.

## Verified tri-language PDF groups

| Insurer | Product or document | Languages | Latest edition verified here | Evidence |
| --- | --- | --- | --- | --- |
| Helsana | General complementary-health CGA/AVB | IT DE FR | 01.2027 (future effective date) | Official private insurance-conditions catalogs and PDF first pages |
| Helsana | PREMED-24 basic insurance conditions | IT DE FR | Not established; inspect PDF before using for a contract | Official private insurance-conditions catalogs |
| Helsana | HOSPITAL semi-private/private supplementary conditions | IT DE FR | Not established; product-specific conditions require matching | Official private insurance-conditions catalogs |
| AXA | OPTIMA/FLEX motor CGA/AVB | IT DE FR | 10.2025 | Edition printed on all three PDF first pages |
| Allianz Suisse | Vehicle insurance CG/AB | IT DE FR | 06.2024 | Edition printed on all three PDF first pages |
| CSS | myFlex supplementary CGA/AVB | IT DE FR | 01.2027 (also 01.2026) | Editions printed on PDF first pages |
| CSS | Dental CGA/AVB | IT DE FR | 01.2027 | Official PDF first pages and insurer catalogs |
| Allianz Suisse | Travel insurance CG/AB | IT DE FR | 09.2021 | Editions printed on official PDF first pages |
| Helsana | Business Salary (collective daily sickness, LCA/VVG) | IT DE FR | 05.2026 | Editions printed on all three official PDF first pages |

The PDF URLs, edition dates and document kinds are in the TypeScript registry,
with 30 records (ten per language). A candidate-match helper can exclude
future editions given a known contract effective date. A true applicability
decision still needs the **specific signed policy**, product, contract terms,
amendments and historical source version; merely having an earlier effective
date is necessary but not sufficient.

## How ATLAS uses this today

The source registry is **not a hidden web scraper**. It is available to the
application and may be used to locate the correct official publication. Only
independently authored semantic guidance is fed to the existing OpenAI
extraction prompt via `getMultilingualCgaInterpretationHints` and
`buildExtractionKnowledgeContext`.

Examples of deliberately distinct concepts:
- **IT** premio annuo, **DE** Jahresprämie, **FR** prime annuelle: the annual
  figure is not doubled merely because the installment mode is
  semestrale/halbjährlich/semestriel.
- In compulsory-health insurance **DE** Franchise vs Selbstbehalt, **FR**
  franchise vs quote-part, **IT** franchigia vs aliquota percentuale are not
  interchangeable fields. In other policies the generic deductible may be
  called Selbstbehalt; the context matters.
- **IT** non assicurato, **DE** nicht versichert, **FR** non assuré identify
  an excluded or not-selected option in a personal policy table.
- A household premium overview must not be added to the premiums of its
  insured persons and products a second time.
- **CGA/AVB** define a possible legal framework; a product page, optional module
  or newer CGA version never proves the customer bought that coverage.

## Testing

`test/insurance-knowledge.test.ts` covers:
1. 30 records and an equal IT/DE/FR distribution;
2. edition filtering (e.g. 2027 CGA cannot be automatically selected for a
   2026 personal contract);
3. canonical insurer topic detection from synthetic IT/DE/FR sentences;
4. passing multilingual interpretation hints into the actual knowledge
   context used by the extractor.

Run `npm run test:knowledge && npm run typecheck && npm run lint`.

## Limitations and next batch

1. Extending to every CGA for every insurer requires a much larger,
   continuously maintained crawler/registry, source access checks, rights
   clearance for persistent copying, revision diffs, and contract-edition
   provenance. **Do not claim to have loaded all Swiss CGA**.
2. Downloading/indexing a public PDF and reproducing its entire text in a
   commercial product are different acts. Request permission or legal advice
   before persistent full-text mirroring or fine-tuning on insurer publications.
3. Optional future secure retrieval should use licensed or authorized sources
   with language, document hash, article/page, edition and publication-date
   provenance. It must avoid downloading customer data to Git.
4. The previously observed PDF parser/quality issue is independent. These
   semantics cannot repair a PDF that never reaches the model.
5. The initial multilingual testing is deterministic, with **synthetic text**.
   Real AI extraction quality has not yet been measured for these sources.

## Source index pages

- Helsana IT: https://www.helsana.ch/it/privati/servizi/documenti-e-download/condizioni-assicurazione.html
- Helsana DE: https://www.helsana.ch/de/private/services/dokumente-und-downloads/versicherungsbedingungen.html
- Helsana FR: https://www.helsana.ch/fr/prives/services/documents-et-telechargements/conditions-assurance.html
- CSS IT: https://www.css.ch/it/clienti-privati/presto-fatto/fallo-da-solo/ordinazione/cga.html
- CSS DE: https://www.css.ch/de/privatkunden/schnell-erledigt/selber-erledigen/bestellen/avb.html
- CSS FR: https://www.css.ch/fr/clients-prives/vite-regle/faire-soi-meme/commande/cga.html
- Allianz IT: https://www.allianz.ch/it/clienti-privati/offerte/veicoli-viaggi/downloads.html
- Allianz DE: https://www.allianz.ch/de/privatkunden/angebote/fahrzeuge-reisen/downloads.html
- Allianz FR: https://www.allianz.ch/fr/clients-prives/offres/vehicules-voyages/telechargements.html
- AXA IT/DE/FR PDFs: directly verified using official AXA docstoredocument URLs in the TypeScript registry.
