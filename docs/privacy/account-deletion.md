# Account deletion workflow (technical)

**Not legal advice. REQUIRES SWISS LEGAL REVIEW for retention.**

## Request intake

Consumer requests deletion via support email or Settings (if UI present).

## Categories

| Bucket | Examples | Default technical handling |
|---|---|---|
| User-controlled | profile display fields, preferences | Delete / anonymize |
| Documents | PDFs in private storage | Delete objects after confirmation |
| Policies | wallet rows | Delete or anonymize identifiers |
| Consultations / messages | collaboration | Anonymize PII; may retain operational shell pending legal |
| Offers / contracts / commissions | financial outcomes | **Do not cascade-delete** without finance/legal review |
| Audit logs | security | Retain; strip unnecessary PII where possible |
| Analytics facts | internal | Remove/anonymize source links; aggregates may remain |
| Intelligence snapshots | aggregates | Usually retained (no PII by design) |

## Process

1. Verify identity of requester
2. Revoke active sessions
3. Revoke broker shares
4. Delete/anonymize user-controlled + documents per checklist
5. Record completion in admin audit
6. Escalate financial/operational retention questions to legal

Do **not** claim regulatory retention periods in product copy.
