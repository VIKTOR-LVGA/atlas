# ATLAS Intelligence

## Product scope

ATLAS Intelligence is a **B2B market analytics** product for:

- insurers
- general agencies
- insurance groups
- approved market partners

It is **not** the Broker Workspace.

Partners never receive:

- names, emails, phones, addresses
- policy numbers, plates
- document PDFs
- raw consultations, quotes, or broker notes

## Routes

Public:

- `/intelligence`
- `/intelligence/apply`
- `/intelligence/status`

Authenticated portal:

- `/intelligence/dashboard`
- `/intelligence/market`
- `/intelligence/switching`
- `/intelligence/premiums`
- `/intelligence/coverages`
- `/intelligence/geography`
- `/intelligence/insurers`
- `/intelligence/reports`
- `/intelligence/profile`

Admin:

- `/control-center/intelligence`

## Access model

Not the `broker` role.

Companies live in `intelligence_companies`.

Users join via `intelligence_memberships` after admin approval of `intelligence_applications`.

Access check: `has_atlas_intelligence()`.

Module entitlement array on the company prepares future plans (Basic / Pro / Enterprise) without hardcoded prices.

## Privacy threshold

Default minimum cohort: **k ≥ 20** (`BENCHMARK_MINIMUM_COHORT_SIZE` / snapshot `minimum_cohort_size`).

This is a **product default pending professional legal/compliance review**. It is not advertised as a legal safe harbor.

If below threshold, APIs return `insufficient_sample` / null metrics — never raw values.

## Representativeness

Always qualify data as:

- “mercato osservato da ATLAS”
- “campione ATLAS”
- “utenti ATLAS”

Do **not** claim “Swiss market” representativeness without validation.

Documented bias risks: selection, regional, product, small samples.

## Data layer

Additive snapshot tables:

- `intelligence_market_snapshot`
- `intelligence_switching_snapshot`
- `intelligence_coverage_snapshot`

RPCs:

- `get_intelligence_market_overview`
- `get_intelligence_switching_matrix`

No browser-side aggregation over raw operational tables.

Snapshots start empty — premium zero / insufficient states are expected.

## Switching methodology

Prefer confirmed ATLAS contract outcomes when building snapshots.

Optional structured `switch_reason_code` on contracts supports future reason aggregates.

Never expose individual switch events to partners.

## Exports

CSV/PDF exports must reuse the same aggregation threshold. Raw export is forbidden.

## Flywheel

Consumer structured policies → anonymized aggregates  
Broker quotes → normalized quote parameters  
Contracts → switch outcomes  
Optional reasons → reason mix  
→ Opportunities benchmarks (evidence-gated)
