# Environment separation

## Target model

| Environment | App | Supabase | Storage | Secrets |
|---|---|---|---|---|
| **Production** | `atlas-liard-three.vercel.app` | Dedicated prod project | Prod buckets | Vercel Production only |
| **Staging** | Vercel Preview / staging host | Dedicated staging project | Staging buckets | Vercel Preview env |
| **Local** | `localhost:3000` | Local Supabase **or** Staging | Local/staging | `.env.local` (never prod service role by default) |

## Current status

Production remains on the live Supabase project.

**Staging project creation requires owner billing/authorization** and is documented as an external manual step:

1. Create a new Supabase project named `atlas-staging`.
2. Run `npx supabase db push --linked` against staging (or `supabase db reset` from migrations).
3. Create Storage buckets mirroring Production (private documents / offer PDFs).
4. Set Vercel Preview env vars to Staging URL + publishable key + staging service role.
5. Keep Production credentials only on the Production environment.
6. Point local `.env.local` at Staging or `supabase start`.

Until Staging exists, Preview must not run destructive fixtures against Production without:

```bash
ATLAS_ALLOW_PROD_FIXTURES=1
ATLAS_CLEANUP_AFTER=1
```

## Template files

- `.env.example` — local/dev placeholders
- `.env.staging.example` — staging placeholders
- Never commit real keys

## Cron

Production daily Intelligence refresh:

- Vercel Cron → `GET /api/cron/intelligence-snapshots` with `CRON_SECRET`
- Optional Supabase `pg_cron` when extension available
