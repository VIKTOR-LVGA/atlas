# ATLAS Intelligence — Data pipeline

## Sources

| Source | Fact table | Notes |
|--------|------------|--------|
| `policies` | `analytics_policy_fact` | Premium annualization, CHF filter |
| `insurance_offers` (verified) | `analytics_quote_fact` | Verified structured quotes |
| `broker_contracts` | `analytics_contract_fact` | Confirmed outcomes |
| `switch_events` | `analytics_switch_fact` | Confirmed switches only |
| `policy_coverages` | → coverage snapshot | Known status only |

## Refresh

`refresh_intelligence_snapshots(p_trigger_source, p_period_days)`

1. Upsert private facts for period
2. Delete existing snapshots for (methodology, period)
3. Write market / premium / switching / coverage / insurer / geography snapshots
4. Mask rows with `source_count < min_cohort_size`
5. Log success/failure in `intelligence_snapshot_runs`

Idempotent: period replace, safe to retry. Failure keeps last valid snapshots.

## Outputs

Partner-readable via RPCs only:

- `get_intelligence_dashboard_summary`
- `get_intelligence_market_overview`
- `get_intelligence_premiums`
- `get_intelligence_switching_matrix`
- `get_intelligence_coverages`
- `get_intelligence_geography`
- `get_intelligence_insurers`

Admin: `get_intelligence_data_health`, `refresh_intelligence_snapshots`
