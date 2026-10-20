# ATLAS Insurance Knowledge Engine — reviewed source expansion
Reviewed: 2026-10-20 · Coverage: Swiss insurance (CH)

## What was added

- `lib/insurance-knowledge/verified-swiss-rules.ts`: 17 original, source-linked extraction/interpretation rules for LAMal, LCA, health household packets, LAINF, vehicles, liability, household, sickness daily benefits, legal protection and pensions.
- `lib/insurance-knowledge/official-cga-catalogs.ts`: 19 official regulator, insurer, comparison and glossary directories.
- `lib/insurance-knowledge/select-hints.ts`: includes the reviewed rules in the **existing** rule selection that feeds the OpenAI document extractor. The AI receives contextual hints only, not fictional customer facts.
- The existing `insurance-sources.json` contains 45 previously indexed references; it remains as-is. The new catalog supplements rather than duplicates the legacy reference collection.
- `test/insurance-knowledge.test.ts`: regression coverage for unique rule/source IDs, source URLs and review metadata.

## Verified official reference groups

| Area | Source | URL |
|---|---|---|
| Mandatory health benefits | UFSP | https://www.bag.admin.ch/it/assicurazione-malattie-lessenziale-in-breve |
| LAMal premiums and cost sharing | UFSP | https://www.bag.admin.ch/it/assicurazione-malattie-premi-e-partecipazione-ai-costi |
| Optional franchises | UFSP | https://www.bag.admin.ch/it/assicurazione-malattie-franchigie-opzionali |
| LAMal premium region | UFSP | https://www.bag.admin.ch/it/assicurazione-malattie-regioni-di-premio |
| Public premium calculator | Priminfo/UFSP | https://www.priminfo.admin.ch/it/praemien |
| Insurance contract law (LCA) | FINMA | https://www.finma.ch/it/documentazione/basi-legali/leggi-e-ordinanze/assicurazioni/ |
| Insurance intermediary duties | FINMA | https://www.finma.ch/it/autorizzazione/intermediazione-assicurativa/ |
| Accident employment scope | Suva | https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-contro-gli-infortuni-lainf/assicurazione-contro-gli-infortuni-chi-e-assicurato |
| Three pillars of pensions | UFAS | https://www.bsv.admin.ch/it/tre-pilastri |
| Pillar 3a contributions | UFAS | https://www.bsv.admin.ch/it/contributi-al-pilastro-3a |
| Insurance terminology | ASA/AFA | https://svv.ch/it/informazioni-di-base/contesto/glossario |
| Personal health policy structure | Helsana | https://www.helsana.ch/it/privati/servizi/assicurazione/polizza-assicurativa.html |
| Personal and supplementary conditions | Helsana | https://www.helsana.ch/it/privati/servizi/documenti-e-download/condizioni-assicurazione.html |
| Business conditions | Helsana | https://www.helsana.ch/it/aziende/servizi/documenti-e-download/condizioni-assicurazione.html |
| LAMal/LCA household/legal CGA catalog | CSS | https://www.css.ch/it/clienti-privati/presto-fatto/fallo-da-solo/ordinazione/cga.html |
| Health and travel CGA catalog | SWICA | https://www.swica.ch/it/privati/servizi/richiedere-scaricare/download |
| Historic and current product conditions | Sanitas | https://www.sanitas.com/it/clienti-privati/servizi/aiuto/documenti-e-download/condizioni-assicurazione.html |
| Vehicle cover and CGA catalog | Zurich | https://www.zurich.ch/it/clientela-privata/mobilita-viaggi/assicurazione-auto |
| Vehicle cover and CGA catalog | AXA | https://www.axa.ch/it/clienti-privati/offerte/veicoli-viaggi/assicurazione-auto.html |
| Multiple insurance categories | Visana | https://www.visana.ch/it/clienti-privati/servizi-e-contatti/servizi/liste-di-controllo-ed-elenchi/cga |
| French-language group CGA catalog | La Mobiliare | https://www.mobiliere.ch/aspect-juridique/conditions-generales-d-assurance |
| Multiple editions and products | Vaudoise | https://www.vaudoise.ch/it/chi-siamo/broker/documentazione/condizioni-generali |
| Property and private liability | Allianz Suisse | https://www.allianz.ch/it/clienti-privati/offerte/casa-tutela-diritti/downloads.html |
| House contents and private liability documents | Helvetia | https://www.helvetia.com/ch/web/it/clienti-privati/assicurazioni/assicurazione-rc.html |
| Group accident and salary insurance | Visana | https://www.visana.ch/it/aziende/servizi-e-contatti/liste-di-controllo-ed-elenchi/documenti-e-download |

## Contract interpretation invariants

1. **Evidence hierarchy:** personal signed policy and named amendments > applicable dated CPA/CSA/CC/CGA > official public explainer. Online product pages and standard clauses **cannot prove purchased coverage**.
2. **Version matching:** insurer, product, effective dates, CGA edition, canton/region and insured persons must match. Without the edition, flag the clause as unverified.
3. **Final premium:** distinguish gross product price, included discount, environmental redistribution, installments, legal fees, and actually payable net amount. Do not sum the total and its components twice.
4. **Frequency:** annual contractual premium is not a semestral premium just because bills are paid twice per year.
5. **LAMal/LCA:** separate compulsory base coverage, private supplementary coverage, insured persons, elected franchise and the statutory cost-sharing percentage.
6. **Negative evidence:** a PDF table showing a component as No/Nein/non assicurato means excluded; brochures and option tables do not activate that coverage.
7. **Dates and currency:** preserve the policy's coverage year and source page; do not apply today's public tariffs retroactively.
8. **Human review:** never guarantee reimbursement, promise coverage or apply a legal conclusion solely from generic insurance knowledge.

## Copyright and privacy

Do **not** copy entire insurer CGAs or the AFA dictionary into this repository. Their pages are referenced by official URLs and the accompanying ATLAS hints are independently authored summaries. Do not store personal policies in Git or use them as automatically approved training datasets. Full clause retrieval, if pursued later, needs rights review, edition control and secure access.

## Limitations / next work

This is a reviewed **initial authoritative expansion, not an exhaustive mirror** of every carrier, product or historical CGA edition. The insurer catalogs can change without notice; their URLs and editions should be periodically checked.

This feature **does not fix PDF parser failures by itself**. The separate observed PDF text-quality failures need parser-level regression tests before AI can receive document text.

Run checks: `npm run test:knowledge`, `npm run typecheck`, `npm run lint`, `npm run build` and review the Pull Request CI results. Use only sanitized/synthetic test fixtures in version control.
