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

## Confirmed blockers before external tester access (as of 2026-10-19)
- Preview builds READY; browser E2E on Production and live RLS tenant isolation have **not** been exercised due write-safety gate.
- Supabase Auth custom SMTP configuration/confirmation email delivery to an outside address not verified. Built-in SMTP is not suitable for external signups.
- Privacy and terms remain draft legal documents, not professionally signed off. Public support contact is not published in privacy page.
- App DB migrations `20261018120000` and `20261018130000` remain pending. Quote/offer classification could fail against old check constraint.
- Off-device encrypted backup and independent password recovery not confirmed.
- Vercel production-domain anonymous access must be tested.
These are **release gates**, not issues solved by a successful Next.js build.

## Additional regression safeguards
- Swiss explicit printed contract-total cross-check flags inconsistencies for review without inventing data.
- KPT *synthetic* fixture: CHF 535.10 LAMal + CHF 32.25 LCA = CHF 567.35/month.
- A premium of exactly CHF 0 is a known free product, not a missing premium.
- Run npm run test:knowledge and the authorized live OpenAI fixture suite before Production.
