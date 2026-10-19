# ATLAS first-user release candidate — 2026-10-19

## UX
- Immediate nonblocking feedback on internal page navigation
- Primary menu: Home, Polizze, Documenti, ATLAS, Profilo
- Simpler empty dashboard and clearer returning-user actions
- One clear AI analysis action after PDF upload; separate archive link

## Extraction safeguards
- Empty coverage labels must not produce invented matches
- Invalid calendar dates rejected
- Unsupported premium frequency must not turn an amount into a monthly payment
- Instructions emphasize Swiss subsidies, annual vs installment premium, accident inclusion per person, and original PDF evidence

## Release gates
- Final Vercel Preview build READY with build/type validation
- Lint, unit tests, authentication/navigation browser tests on a real account
- Authorized synthetic E2E: upload, AI review, confirmation, persistence, tenant isolation and cleanup
- Review two pending Supabase migrations and DB lint warnings; no migration without new permission
- Backup off-device and independent password recovery
- Official Production domain mapped to Vercel project atlas, not atlasos
- Verify terms/privacy, signup email, account deletion and support contact
- Fixture corpus: Helsana 863.55 CHF/mo multi-person, Zurich CGA (not personal policy), KPT, synthetic motor 864 CHF/year, missing fields null

No 100% accuracy claims. Scanned/unreadable PDF and ambiguous clauses must be reviewed manually.
