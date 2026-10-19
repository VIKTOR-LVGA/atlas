# ATLAS controlled Production validation

The current checkout is linked to Supabase project `ycjltpxxetxvuptwlxlr`.
The project is Production. The definitive validation decision is to use only
short-lived synthetic data in this existing project; no staging project should
be created for this run.

## Current stop condition

`supabase backups list --project-ref ycjltpxxetxvuptwlxlr --output json`
returned `backups: null` and `pitr_enabled: false` on 2026-10-19. A recoverable
backup has therefore not been demonstrated. Production write tests and both
pending migrations must remain blocked until backup recovery is independently
verified.

The local environment also lacks `SUPABASE_SERVICE_ROLE_KEY`, so Auth users
cannot be guaranteed to be removed after a failed or interrupted run.

## Required evidence before any write

1. Confirm the linked ref is exactly `ycjltpxxetxvuptwlxlr`.
2. Enable or otherwise demonstrate a restorable backup and record its timestamp
   and recovery procedure. Listing WAL capability alone is not proof of a
   restorable recovery point.
3. Run `supabase/preflight/20261018_production_readonly.sql` with a read-only
   database role and save the complete output outside the repository.
4. Provide `SUPABASE_SERVICE_ROLE_KEY` only in the local shell. Never expose it
   through `NEXT_PUBLIC_*`, Vercel, logs, screenshots, or committed files.
5. Set a unique `ATLAS_E2E_RUN_ID`. Use at most two accounts, five PDFs and ten
   OpenAI requests. Every row note/source key and Storage path must include the
   run ID.
6. Do not create consultation requests, partner applications, broker records,
   offers, contracts, leads or outbound notifications.
7. Record exact Auth user IDs, row IDs and Storage object paths in a local,
   ignored cleanup ledger before continuing past each creation boundary. The
   live script uses Admin Auth creation with `email_confirm: true` on Production,
   so it does not send confirmation email to the synthetic address.

The fixture guard requires all four controls for Production:

```text
ATLAS_ALLOW_PROD_FIXTURES=1
ATLAS_CLEANUP_AFTER=1
ATLAS_PROD_BACKUP_VERIFIED=1
SUPABASE_SERVICE_ROLE_KEY=<local only>
```

The backup flag is an operator attestation, not a backup mechanism. It may be
set only after step 2 has been completed.

## Migration analysis

### 20261018120000_sync_document_type_constraints.sql

This takes an `ACCESS EXCLUSIVE` lock on `public.documents` while replacing one
check constraint. It does not rewrite document rows, but inserts and updates are
briefly blocked. Compatibility requires zero rows outside the new taxonomy.
Rollback is executable at
`supabase/rollback/20261018120000_sync_document_type_constraints.sql`; it aborts
if `quote` or `offer` rows exist because those values are not accepted by the
previous constraint.

### 20261018130000_fix_pilot_database_functions.sql

This replaces three functions without changing tables, RLS or data. Existing
calls may wait briefly on function catalog locks. The preflight emits the exact
current `pg_get_functiondef` for all three functions. Save that output before
the migration: those definitions are the executable rollback pre-image. A
rollback that blindly restores the repository's older definitions is unsafe,
because those are the invalid definitions this migration repairs.

Run `supabase db push --linked --dry-run --include-all` first. Applying either
migration requires a separate explicit approval after the backup and preflight
evidence is available. Never run `db push` as part of the E2E command.

## Cleanup and verification

Cleanup order is Storage objects, child rows, policy/document rows, then Auth
users. Verify each deletion by exact ID/path and repeat cross-user reads after
cleanup. If cleanup fails, stop immediately, preserve the ledger, and do not
start another run. The browser path excludes all broker/consultation UI.

The official Helsana and Zurich PDFs stay outside Git. Their checksums, official
source URLs and expected classifications are tracked in
`test/fixtures/insurance-pdf-corpus.json`. The requested KPT 2026 PDF was not
provided locally and its expected figures therefore remain unverified.
