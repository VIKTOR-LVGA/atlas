# ATLAS post-audit QA report

Date: 2026-10-19  
Base: `fix/atlas-ui-pixel-fidelity` at `e1db04a`  
Implementation branch: `fix/atlas-post-qa-20261019`

No production deployment, Supabase migration, production data write or real
Intelligence application was performed.

## Results

| ID | Result | Evidence |
|---|---|---|
| ATLAS-QA-001 | Review package complete; legal approval remains open by design | `docs/legal-review/ATLAS_LEGAL_REVIEW_2026-10-19.md`; draft notices retained |
| ATLAS-QA-002 | Fixed | Intelligence nav/footer links use homepage anchors; Chromium regression passes |
| ATLAS-QA-003 | Fixed for the audited sample | axe desktop/mobile: 0 `color-contrast`, 0 `link-in-text-block` violations across landing, Privacy, Terms, login, registration, password recovery, Intelligence and application form |
| ATLAS-QA-004 | Fixed with staged CSP rollout | Defensive headers enforced; CSP is Report-Only; browser header regression passes; decision record in `docs/security/post-qa-headers.md` |
| ATLAS-QA-005 | Fixed | Disabled broker/legacy partner routes terminate on an explicit unavailable page, not 404 or a fictitious dashboard |
| ATLAS-QA-006 | Fixed | `/activity`, `/atlas/*`, `/claims/*` and `/search` preserve path/query in validated `next`; open-redirect and expired-session regressions pass |
| ATLAS-QA-007 | Fixed for pilot posture | robots, sitemap and manifest return 200; global `noindex,nofollow`; sitemap exposes only `/` and `/intelligence` |
| ATLAS-QA-008 | Fixed | One submit exposes all field errors inline, focuses a summary and performs no backend submit; unit and Chromium regressions pass |

## Automated verification

- `npm run typecheck`: pass
- `npm run lint`: pass, zero warnings
- `npm run build`: pass, Next.js 16.3.8, 83 static pages generated
- `npm run test:intelligence`: pass
- `npm run test:insurance-os`: pass
- `npx tsx test/broker-portal-hibernate.test.ts`: pass
- `npm run test:e2e -- e2e/public-journeys.spec.ts e2e/insurance-os.spec.ts --project=chromium`: 20/20 pass
- `npm run test:knowledge`: pass
- `npm run test:financial`: pass, 11 checks
- `npm run test:experience`: pass
- `npm run test:staging-safety`: pass; guard-only test, no fixture creation
- `npm run verify:migrations`: pass, 36 existing files; no migration added

Protected Vercel Preview was checked read-only with authenticated `vercel curl`:

- `/`: 200 with CSP Report-Only, nosniff, referrer, permissions and anti-frame
  headers present;
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`: 200;
- `/partner/dashboard`: final 200 at `/broker-unavailable`;
- Vercel still emits `Access-Control-Allow-Origin: *` on public HTML, confirming
  the platform observation documented in the security decision record.

The complete authenticated E2E suite was intentionally not run against the
configured production Supabase project because it creates and deletes fixture
accounts, documents and policies.

## Visual and accessibility evidence

Before evidence is in `/Users/armirhoti/ATLAS-QA-2026-10-19/screenshots` and
the stable UI baselines are in `docs/ui-review/`.

After evidence is in
`/Users/armirhoti/ATLAS-QA-POSTFIX-2026-10-19/screenshots`, including:

- landing desktop/mobile full-page and matching viewport captures;
- landing desktop/mobile amplified pixel diffs;
- Intelligence, Privacy, registration, unavailable-broker and application
  validation captures.

Against the checked-in landing baselines, the mean absolute channel difference
is 0.202 desktop and 0.716 mobile (0–255 scale). Channels changing by more than
2 levels are 0.50% desktop and 1.04% mobile. Changes are limited to the audited
contrast colors and inline-link underline.

The dashboard components and app layout were not edited. The shared light-theme
`--muted` token was darkened, so muted dashboard copy may change slightly. A new
authenticated dashboard screenshot is blocked: no controlled non-production
account is configured, and creating or impersonating a production user would
violate the scope. Checked-in baselines remain at:

- `docs/ui-review/dashboard-desktop-1440.png`
- `docs/ui-review/dashboard-mobile-390.png`

## Residual risks and approvals

- CSP remains Report-Only until real Preview violations are collected and inline
  allowances can be narrowed.
- The platform-level wildcard CORS header observed by the audit must be checked
  again on Preview/Production; ATLAS does not add it in application code.
- Login continuation and expired-session behavior are automated. The repository
  already contains an authenticated logout regression, but it was not executed
  against production because it requires a controlled account.
- Privacy and Terms remain drafts. Publication is blocked on the named human,
  legal, privacy, security and procurement approvals in the legal checklist.
- No deployment verification has been performed because production deployment
  was explicitly out of scope.
