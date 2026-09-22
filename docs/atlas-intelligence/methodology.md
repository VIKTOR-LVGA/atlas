# ATLAS Intelligence — Methodology

Version: `atlas-intelligence-v1`

## Sample

Metrics describe the **ATLAS observed sample** only. They are not a claim of Swiss market representativeness.

## Eligibility

### Premium benchmark

- category known
- insurer known (when dimensioned by insurer)
- annualized premium reliable and &gt; 0
- currency CHF (non-CHF excluded from CHF benchmarks)
- policy status active

### Switching

- `from_insurer` ≠ `to_insurer`
- confirmation source in `broker_confirmed` | `consumer_confirmed` | `user_declared` | contract-linked
- same-insurer renewals are **not** switches
- quotes without confirmation are **not** switches

### Coverage penetration

- denominator = policies where coverage status is `included` or `excluded`
- `unknown` is never treated as excluded

## Distributions

Primary: **median**, **P25**, **P75**. Min/max not exposed.

## Premium delta after switch

Report **observed median difference** only when both sides have reliable premiums. Do not claim causal savings.

## Age / geography

- Age: bands 18–24 … 65+ only
- Geography: Swiss canton code only (no address / postcode)

## Limitations

Selection bias, incomplete canton coverage, small cohorts, correlation ≠ causation.
