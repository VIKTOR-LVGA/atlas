# Environment separation (P2)

ATLAS Production, Preview, and local Development have historically shared the
same Supabase project (`ycjltpxxetxvuptwlxlr`). That caused test pollution in
the live Control Center.

## Target

| Environment | App host | Supabase |
|---|---|---|
| Production | `atlas-liard-three.vercel.app` | Dedicated prod project |
| Staging / Preview | Vercel Preview | Dedicated staging project |
| Local | `localhost` | Local Supabase or staging |

## Interim protections

Live fixture scripts (`scripts/*-validation.mjs`) refuse to run against the
production project ref unless:

```bash
ATLAS_ALLOW_PROD_FIXTURES=1
ATLAS_CLEANUP_AFTER=1
```

QA emails use the recognizable prefix `atlas-(e2e|partner|consumer|broker|admin|qa)-`.

## Next step

Create a separate staging Supabase project, point Preview + local `.env` at it,
and keep Production credentials only on the Production Vercel environment.
