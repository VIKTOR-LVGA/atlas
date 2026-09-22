# Opportunities Intelligence Engine

## Maturity model

| Level | Meaning |
|-------|---------|
| 0 | No comparison possible |
| 1 | Account/document reminder |
| 2 | Internal preliminary benchmark |
| 3 | High-confidence benchmark |
| 4 | Validated broker/insurer quote |

## Savings guardrails

`canShowSavingsEstimate()` requires:

- maturity ≥ 2 (or real quote)
- sample size ≥ `BENCHMARK_MINIMUM_COHORT_SIZE` (default **20**, legal-review pending)
- coverage comparable
- similarity medium/high
- data complete
- non-null impact range

**No fake CHF savings.**

## Comparison outcomes

- lower cost / same coverage
- same cost / better coverage
- lower cost / reduced coverage
- higher cost / material coverage improvement

Never label all of these as “risparmio”.

## Privacy

Aggregates only. No raw documents in shared corpus. Minimum cohort size documented in `foundation.ts`.

## Current activation

Level 1 cards: expiration, missing data, document followup, coverage gaps from PDF exclusions, broker review.

Level 0 “In analisi” placeholder when motor structure exists but no cohort.

Real quote comparison UI is scaffolded via maturity labels + consultation CTA.
