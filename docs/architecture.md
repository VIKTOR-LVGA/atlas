# ATLAS system architecture

## Surfaces

1. **Consumer** — wallet, extraction, opportunities, consultations
2. **Broker** — ATLAS-originated clients, offers, contracts, commissions
3. **Intelligence** — privacy-safe aggregates for approved B2B partners
4. **Control Center** — admin governance, health, pilot funnel

## Stack

- Next.js App Router (Vercel)
- Supabase Auth, Postgres, Storage, RLS, RPCs
- OpenAI structured extraction (server-only)
- Intelligence: private facts → versioned snapshots → entitlement RPCs

## Security boundaries

- RLS + security-definer RPCs enforce access
- Intelligence partners: aggregates only, k-threshold
- Brokers: assigned + explicitly shared resources
- Service role: server/cron only, never browser

## Docs

- `docs/environment-separation.md`
- `docs/atlas-intelligence/*`
- `docs/operations/*`
- `docs/pilot/*`
- `docs/privacy/*`
- `docs/compliance/swiss-pilot-checklist.md`
