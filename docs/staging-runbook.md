# ATLAS Supabase staging runbook

ATLAS staging must be a separate Supabase project. A Vercel Preview that points
to the Production project is not a staging environment.

## Required resources

1. Create a Supabase project named `atlas-staging` in organization
   `hbqqxxbibclvvactbpec`, preferably in `eu-central-1`.
2. Use a new database password that is not shared with Production.
3. Copy the staging project URL, publishable key, service-role key and project
   ref into an ignored `.env.staging.local`, using `.env.staging.example` as the
   template. The service-role key is for local fixture cleanup only and must not
   be exposed to the browser or committed.
4. In staging Auth, disable email confirmation for automated E2E accounts, or
   connect a test inbox and update the E2E flow to consume confirmation links.
5. Add the Vercel Preview URL and `http://localhost:3001/**` to staging Auth
   redirect URLs.
6. Configure Vercel Preview variables with the staging URL/publishable key and
   an OpenAI key. Remove branch-scoped Preview overrides that point back to
   Production. Do not add the service-role key to the application deployment.

## Migration sequence

Do not relink this checkout, which is intentionally linked to Production. Run
the staging migration explicitly by project ref:

```bash
set -a
source .env.staging.local
set +a

./node_modules/.bin/supabase db push \
  --project-ref "$ATLAS_STAGING_PROJECT_REF" \
  --password "$ATLAS_STAGING_DB_PASSWORD" \
  --dry-run

./node_modules/.bin/supabase db push \
  --project-ref "$ATLAS_STAGING_PROJECT_REF" \
  --password "$ATLAS_STAGING_DB_PASSWORD"
```

The dry run must include the document taxonomy sync and pilot function repair
migrations. After the push, run schema lint and confirm that no migration is
pending before enabling the browser suite.

## Validation sequence

```bash
set -a
source .env.staging.local
set +a

npm run test:supabase-live
npm run test:openai-fixtures
PLAYWRIGHT_BASE_URL="https://YOUR_PREVIEW_URL" npm run test:e2e
```

`ATLAS_STAGING_PROJECT_REF` must match the project ref embedded in
`NEXT_PUBLIC_SUPABASE_URL`, and `ATLAS_CLEANUP_AFTER=1` is mandatory. The live
validation creates two isolated customers, checks database and Storage RLS in
both directions, and removes the Auth users with the staging service-role key.
