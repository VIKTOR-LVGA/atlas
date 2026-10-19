# Login and dashboard latency — 2026-10-19

This branch is an **optimization candidate**, not a measured production speedup.

## Findings from code review

1. `app/login/LoginPageClient.tsx` previously waited for `current_user_role` on every login, then issued `router.push` **and** `router.refresh`. Consumer login now has one full navigation and leaves role authorization to the existing server layouts. Intelligence retains its role check.
2. The dashboard loads profile, policies, documents, requests, coverage, changes and claims in parallel, but each used its own remote `auth.getUser()`. `getCurrentRequestAuth()` deduplicates verification **within one server render request**, never across users or requests.
3. `syncAttentionItems` previously sent one update per stale opportunity in series; these are now updated in one user-scoped statement.
4. Database reads/writes, browser/network latency, and Supabase infrastructure have **not** been timed yet.

## Local verification (no Production mutations required)

```sh
git fetch origin
git switch --track origin/perf/atlas-login-dashboard-fast-path
npm ci
npm run lint
npm run typecheck
npm run build
ATLAS_PERF_LOG=1 npm run start
```

Open a **private** browser window at `http://localhost:3000/login`, then sign in with a pre-existing account (no test data creation). Record median time (at least 3 trials) from clicking **Accedi** to interactive dashboard. Compare against the previous auth-fix branch on the **same computer/network**.

Backend logs (milliseconds; opt-in only):

- `[atlas:perf] proxy_auth_ms`: Supabase token verification in proxy
- `[atlas:perf] render_auth_ms`: request-scoped server verification
- `[atlas:perf] dashboard_fetch_ms`: seven parallel dashboard data loaders
- `[atlas:perf] dashboard_actions_ms`: Action Center reconciliation

No user IDs, tokens, document contents or raw query results are logged. Turn off by running `npm run start` without `ATLAS_PERF_LOG`.

In the browser Network panel, inspect the sign-in request, initial `/dashboard` document request and total load time. Test first login, page refresh, logout/relogin, and a Broker/Intelligence account if available.

**Important:** `npm run start` serves an existing build and will not incorporate changes until after `npm run build`.

## Guardrails

No DB migrations, RLS changes, uploads, service-role credentials, or Production deploys are part of this branch. The source changes have not been compiled or exercised in the user's local environment by the assistant.
