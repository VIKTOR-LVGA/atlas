# Supabase Production backup restore verification

Verified on 2026-10-19 for project `ycjltpxxetxvuptwlxlr`. This document does
not authorize Production writes, migrations, deploys, or an E2E run.

## Isolated restore result

The encrypted archive was decrypted into a mode-`0700` temporary directory by
retrieving its passphrase from macOS Keychain without printing it. Every
component size and SHA-256 matched `backup-manifest.json`.

PostgreSQL 17.11 was installed with Homebrew and launched directly, without a
Homebrew service. The temporary server used only a mode-`0700` Unix socket;
`listen_addresses` was empty, `inet_server_addr()` was `NULL`, and no TCP
listener existed on its configured port.

The application restore passed with these results:

- 62 `public` tables and all 964 dumped rows, compared table by table;
- 71 application functions;
- 187 dumped named constraints, plus PostgreSQL-managed constraints;
- 156 indexes;
- 33 application triggers;
- RLS enabled on 61 tables and 100 policies present;
- 334 `GRANT` and 60 `REVOKE` statements applied, with 1,085 effective table
  grants visible for `anon`, `authenticated`, and `service_role`;
- role timeout settings restored for `anon`, `authenticated`, `authenticator`,
  and `supabase_admin`;
- `pg_stat_statements`, `pgcrypto`, and `uuid-ossp` installed successfully.

The platform-managed `pg_cron` and `supabase_vault` extensions and the
`supabase_realtime` publication were omitted only from the temporary restore.
They remain represented by the original untouched dump and are expected to be
provided by a Supabase target.

The Auth and Storage schemas are managed by Supabase and their DDL is excluded
by the standard CLI schema dump. Their payloads were therefore restored into
isolated text-compatible verification tables, not into functional Auth or
Storage services. All 26 Auth tables/50 rows and 7 Storage tables/8 rows loaded,
and all 33 COPY blocks matched the copies in the general data dump by SHA-256.

All six archived Storage objects were readable, matched manifest sizes, and had
valid PDF signatures. Their combined size was 2,731,562 bytes. The encrypted
archive checksum protects these objects as part of the complete package.

## Off-device recovery requirement

The passphrase currently exists only in the login Keychain on this Mac. Before
depending on the backup for disaster recovery:

1. Create a secure-note or password item in an approved end-to-end encrypted
   password manager. Store the archive identifier, cipher parameters from
   `RECOVERY.txt`, and the passphrase. Do not store the encrypted archive in the
   same password-manager item.
2. Retrieve the existing value without terminal output by piping the exact
   `security find-generic-password` command from `RECOVERY.txt` directly into
   the password manager's secure input or clipboard integration. Clear the
   clipboard immediately afterwards. Never paste it into chat, logs, shell
   history, source files, or issue trackers.
3. Copy the `.enc`, `.sha256`, and `RECOVERY.txt` files to an approved encrypted
   external volume or private encrypted backup vault. Do not use GitHub,
   Vercel, a public bucket, or an unapproved sync folder.
4. On a second trusted machine, verify the `.sha256`, decrypt to a protected
   temporary directory using a hidden password prompt, list the tar archive,
   and immediately remove plaintext output. This is the off-device recovery
   test; merely copying the files is not sufficient.

Until steps 1-4 are completed by the backup owner, loss of this Mac and its
Keychain can make the archive unrecoverable.

## Controlled Production E2E gate

The single intended Production command targets only
`e2e/staging-real-journey.spec.ts` through
`npm run test:e2e:production-controlled`. It remains skipped unless all of
these are explicitly supplied for the authorized run:

```text
ATLAS_PRODUCTION_E2E=1
ATLAS_ALLOW_PROD_FIXTURES=1
ATLAS_CLEANUP_AFTER=1
ATLAS_PROD_BACKUP_VERIFIED=1
ATLAS_E2E_RUN_ID=prod-<unique-lowercase-run-id>
```

Production mode requires the exact Production ref and an Admin key. It creates
exactly two uniquely named, email-confirmed Auth users through Admin API, so no
registration email is sent. It uses only the repository's synthetic PDFs,
performs two document analyses and one Ask ATLAS request, and does not enter
Broker, consultation, partner, or notification flows.

Cleanup identifies users by the exact run-specific emails, removes their
Storage objects, deletes non-cascading product/audit rows, deletes the Auth
users, and verifies that no policies, documents, or Storage files remain for
their IDs. Production self-service registration is intentionally not exercised
because it could invoke the configured external mailer; that step still
requires staging or a separately approved mail configuration check.
