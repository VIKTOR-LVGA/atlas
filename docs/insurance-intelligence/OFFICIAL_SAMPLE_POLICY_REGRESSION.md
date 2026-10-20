# Official public sample policies: ATLAS regression set

These three insurer-hosted PDFs are **public examples/facsimiles**, not verified real customer contracts. The test corpus stores source links and independently transcribed expected fields, **not full copyrighted PDFs**.

| Fixture | Source | Language | Pages | Period | Expected total |
|---|---|---|---:|---|---:|
| helsana-sample-2024-it | [Helsana sample IT](https://www.helsana.ch/dam/it/pdf/private/broschueren/versicherungspolice-beispiel.pdf) | IT | 4 | monthly | CHF 863.55 (3 people) |
| helsana-sample-2024-fr | [Helsana sample FR](https://www.helsana.ch/dam/fr/pdf/prives/brochures/police-dassurance-exemple.pdf) | FR | 4 | monthly | CHF 863.55 (same example) |
| kpt-facsimile-2026-it | [KPT facsimile IT](https://www.kpt.ch/documents/71d2e810-bfd6-484f-ad5b-0ae519fc4376/police_f%C3%BCr_psd_250822_i.pdf) | IT | 2 | monthly | CHF 567.35 (1 person) |

## Source verification and page evidence

All URLs returned publicly readable PDF documents on 2026-10-20. The Helsana IT/FR page 1 of 4 contains the three insured-person premiums and CHF 863.55 total. Page 2 of 4 distinguishes the CHF 293.20 LAMal intermediate amount, CHF 5.35 environmental refund and CHF 287.85 actual net premium; page 3-4 contains the CHF 52.85 supplementary insurance total and product-specific CGA editions. KPT page 1 of 2 shows CHF 512.95 base + CHF 27.30 accident - CHF 5.15 environmental refund = CHF 535.10 LAMal; page 2 shows CHF 32.25 LCA and CHF 567.35 combined.

## What the tests do and do not do

- `test/fixtures/insurance-knowledge/official-sample-policy-ground-truth.json` stores manually verified answers and source URLs.
- `test/official-sample-policies.test.ts` checks fixture structure, arithmetic consistency and cross-language scenario equivalence.
- `npm run test:knowledge` runs these checks in CI.
- **These are ground-truth data consistency tests, not end-to-end PDF extraction tests.** They do not download PDF bytes, invoke the LLM, or prove ATLAS can correctly read an uploaded PDF.
- Next stage: fetch documents into a permitted, versioned test cache; exercise the actual production extraction pipeline; compare its structured output with the fixture and report per-field precision, recall and provenance. Obtain necessary permissions before persistent redistribution or bulk ingestion.

## Critical interpretation rules

- The Helsana French and Italian PDFs describe the same synthetic household and must not be counted as two independent cases.
- `CHF 2'500` is a deductible, **not** a premium.
- CGA/CSA editions printed on a contract govern candidate selection; a newer public edition does not automatically apply.
- The 2024/2026 examples do not establish today's commercial prices.
