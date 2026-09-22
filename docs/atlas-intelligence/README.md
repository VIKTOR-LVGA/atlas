# ATLAS Intelligence

Privacy-safe B2B market intelligence on the **ATLAS observed sample**.

## Product surfaces

- `/intelligence` — public product
- `/intelligence/dashboard` … `/intelligence/reports` — partner portal
- `/intelligence/methodology` — methodology & limitations
- `/control-center/intelligence` — admin partners + snapshot health

## Architecture

```
Operational sources (private)
  → analytics_*_fact (private, no partner SELECT)
  → intelligence_*_snapshot (aggregated, k-threshold masked)
  → security-definer RPCs (entitlement + suppression)
  → Intelligence UI (aggregates only)
```

## Privacy

- `intelligence_settings.min_cohort_size` (default **20**)
- Env override: `ATLAS_INTELLIGENCE_MIN_COHORT_SIZE`
- Below threshold → `insufficient_sample`, no metric values
- Partners never receive PII or raw operational rows
- Module entitlements enforced in RPCs, not only UI

## Snapshots

Refresh: `refresh_intelligence_snapshots(trigger, period_days)`

- Idempotent period replace per methodology version
- Audited in `intelligence_snapshot_runs`
- On failure, previous snapshots remain
- Admin rebuild from Control Center

Methodology: `atlas-intelligence-v1`

## Wording

Always:

- Campione ATLAS
- Mercato osservato da ATLAS
- Quota osservata nel campione ATLAS

Never:

- Swiss market share (from ATLAS-only data)
