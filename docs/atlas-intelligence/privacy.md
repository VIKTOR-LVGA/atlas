# ATLAS Intelligence — Privacy

## Absolute prohibitions for partners

No names, emails, phones, addresses, birthdays, policy numbers, plates, VIN, PDFs, consultation messages, broker notes, raw quotes/contracts/switch events, or individual Consumer rows.

## Threshold

Configurable `min_cohort_size` (default 20) via `intelligence_settings` / `ATLAS_INTELLIGENCE_MIN_COHORT_SIZE`.

Every filtered cohort must meet k **after** filters. Responses use `insufficient_sample` without leaking suppressed values.

## Suppression

Matrix cells and subgroup metrics below k are suppressed (`—` / insufficient). Exports must apply the same rules.

## Anti-differencing

- Allowlisted dimensions only (period, category, canton, age_band, insurer, coverage)
- No arbitrary SQL analytics for partners
- Bucketed age and geography
- Query audit table for analytical access

## Raw access

Intelligence role has **no SELECT** on private `analytics_*_fact` tables. Snapshot tables are aggregate-only; RPCs re-check k and entitlements.

## Deletion / rights

Architecture avoids irreversible identity linkage in partner-facing aggregates. Historical aggregates may require separate legal review for retention — documented, not invented here.
