# Recovery & rollback

## Vercel app rollback

1. Vercel → Project → Deployments
2. Identify last known-good Production deployment
3. Promote / Rollback to that deployment
4. Smoke: `/`, `/login`, `/broker/dashboard`, `/intelligence`, `/control-center`

## Database

- Prefer **forward-fix** for additive migrations.
- Do not run destructive down migrations in Production without backup plan.
- Verify Supabase automated backups are enabled in the dashboard (do not claim existence unless confirmed by owner).

## Bad data change

1. Stop write path if active (feature flag / deploy freeze)
2. Identify affected tables from audit logs
3. Restore from backup or surgically reverse with reviewed SQL
4. Rebuild Intelligence snapshots after restore

## Storage loss

1. Confirm bucket policies
2. Restore objects from backup if available
3. Re-link document metadata carefully

## Failed deployment

1. Roll back Vercel
2. If migration already applied, leave DB forward and patch app
3. Document in incident log
