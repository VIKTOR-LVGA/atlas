# ATLAS Insurance Document Intelligence 2.0

## Classifier (atlas-swiss-v2)

Personal policies that *cite* CGA/AVB are classified as `policy`, not `general_conditions`.

Deterministic `scorePersonalContractSignals()` aggregates individualized evidence
(policy number, named insured, address, premium, dates, plate/vehicle, selected coverages, deductibles).

| Rule | Behavior |
|------|----------|
| Personal score ≥ 8 | Force `policy` + optional `embedded_general_conditions_reference` |
| Conditions score ≥ 4 and personal score < 5 | `general_conditions` / supplementary |
| Otherwise | Highest lexical signal with personal boost |

Regression: Zurich-like fixture + real PDF extract must remain `policy`.

## Extraction pipeline

1. PDF text (`pdf2json`, structured when better)
2. Document classification + insurer recognition
3. Persist classification metadata (`classifier`, `knowledge_version`, `extractor_version`, `personal_contract_score`)
4. OpenAI schema extraction (fast → strong fallback)
5. Swiss enrichment + validation flags (no silent invent)

## Swiss corpus / source registry

Path: `lib/insurance-knowledge/insurance-sources.json`

Only public/official product pages, AVB/CGA, and regulator guidance.
Customer PDFs are never added.

See `SOURCES.md` for counts and research gaps.

## Policy UX

- `MotorPolicyExperience` on motor policy detail (hero, included/excluded coverages)
- Friendly failure copy (`Condizioni generali`, not raw enums)
- Retry / reanalyze / manual create / feedback (`DocumentAnalysisFeedback`)

## Privacy

- No raw personal PDFs in git
- Anonymized fixtures only under `test/fixtures/insurance-knowledge/`
- Feedback logs reason enums only (no PDF body)

## Versions

- Classifier: `atlas-swiss-v2`
- Knowledge: see `lib/insurance-knowledge/versions.ts`
- Extractor: `openai-policy-v2`
