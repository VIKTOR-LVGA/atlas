# Incident runbook

## Principles

1. Contain first (stop leakage / stop bad writes).
2. Prefer forward-fix for additive DB migrations.
3. Never paste secrets into tickets/chat.
4. Preserve audit evidence.

## Scenarios

### Login outage
- Detect: spikes of 401/5xx on `/login`, Auth errors in logs.
- Contain: check Supabase Auth status; freeze risky deploys.
- Diagnose: Auth URL, cookie domain, redirect URLs.
- Recover: roll back Vercel deployment if app regression; restore Auth config.
- Document: time, impact, root cause.

### Database unavailable
- Detect: Control Center Health DB failure / 5xx.
- Contain: pause writes if partial; communicate pilot pause.
- Diagnose: Supabase status, connection limits.
- Recover: wait for platform recovery; verify migrations.

### Document upload failure
- Detect: user reports / storage 403/413.
- Contain: disable new uploads only if systemic.
- Diagnose: RLS, bucket policies, MIME/size limits.
- Recover: fix policy; re-try user upload (document should not be lost if object exists).

### OpenAI extraction outage
- Detect: extraction errors / timeouts.
- Contain: show friendly failure; keep PDF.
- Diagnose: API key, model availability, rate limits.
- Recover: retry; manual completion path.

### Email outage
- Detect: password reset failures.
- Contain: document manual reset via Admin if needed.
- Diagnose: SMTP / Supabase email settings (`noreply@mail.atlasos.ch`).
- Recover: restore provider; do not mass-mail.

### Snapshot failure
- Detect: Control Center Intelligence / Health last_run=failed.
- Contain: keep last successful snapshot (engine already does).
- Diagnose: `intelligence_snapshot_runs.error_message`.
- Recover: Admin Rebuild; verify cron / `CRON_SECRET`.

### Suspected data exposure
- Detect: unexpected aggregate leak, public URL, cross-user access.
- Contain: revoke keys, suspend partner, rotate secrets, tighten RLS.
- Diagnose: audit logs, storage policies, RPC grants.
- Recover: notify stakeholders per legal advice; patch; verify matrix.
- Document: timeline for legal/privacy review.
