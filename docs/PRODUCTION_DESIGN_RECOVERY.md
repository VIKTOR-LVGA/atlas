# Production design recovery — 20 October 2026

## Verified cause

`safety/evidence-first-extraction` at `b2126df` branched from `1c57fc0`,
before the consumer redesign. It contains five extraction safety commits, but
none of the newer design history. Its landing headline was “Atlas capisce le tue
assicurazioni svizzere”.

The local `.next` directory belonged to another source tree. Starting that saved
build reproduced “Le tue assicurazioni, finalmente chiare”, although those
components were absent from the checked-out source. Its generated route types
also referenced numerous routes absent from this branch. No process was listening
on port 3000 when diagnosis began; the previous dev process cannot be identified
after it has exited.

The production deployment `dpl_35umyZVtjfcaF8WYiZ8mfPm92jWY` was built without
cache, from 162 source files, with Next.js 16.2.6. Vercel correctly compiled the
older checked-out source. The configured team, project, root and aliases were
correct. There was no development/production design switch.

The installed local Next.js was also left over from another branch (16.3.8).
`npm ci` restored the lockfile version, 16.2.6.

## Recovery scope

Presentation components, shared CSS and brand assets were selectively recovered
from `origin/fix/atlas-post-qa-20261019` (`206d8e8`), the successor of the
Apple/Revolut and reference-fidelity design branches. The public landing matches
the previously saved local build exactly at 1440px.

The authenticated shell, mobile dock, account menus and alpine dashboard hero
use the recovered presentation. Navigation is adapted to this branch's real
routes. The existing dashboard queries and remaining authenticated page contents
are retained: this is not a merge of the newer branch's additional product modules.

The three extraction safety files (`lib/document-analysis.ts`,
`lib/openai-policy-extraction.ts`, `lib/pdf-text.ts`) remain byte-for-byte
unchanged from `b2126df`. No Supabase schema, migration, environment value or
user data was modified.

Production exposes `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, while the old source
accepted only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The shared config now supports
both names, including browser build-time inlining. Six tests cover this boundary.

`.vercelignore` excludes local caches, environment files and test output from
future source deployments.

## Checks

- `npm ci`
- `npm test`: six Supabase configuration tests
- `npm run lint`: no errors; existing unused helper warning in `lib/pdf-text.ts`
- `npm run typecheck`
- `npm run build`: all existing routes compile
- Chromium: public landing/login/register at 1440px and 390px
- Chromium: nine authentication guards and nine authenticated routes
- Chromium: real test-account login, mobile navigation and logout
- Development versus local production screenshots: identical pixels for all six
  public route/viewport combinations
- Saved old local landing versus rebuilt landing at 1440px: identical SHA-256

Evidence and the reusable browser verification script are outside the repository:
`/Users/armirhoti/ATLAS-PRODUCTION-RECOVERY-2026-10-20/`.
Browser checks only read existing test-account data. They do not upload PDFs,
trigger paid AI calls, or change policy records.

## Repeatable release procedure

1. Confirm the checked-out source contains the intended design; a saved `.next`
   build is not source provenance.
2. Stop local servers before changing branches or replacing build artifacts.
3. Reinstall from the lockfile with `npm ci` and regenerate the production build.
4. Verify team/project with `vercel project inspect --non-interactive`.
5. Stage production with `vercel deploy --prod --skip-domain --force`.
6. Verify that deployment, then promote it and verify the public alias.

Do not merge unrelated backend or schema changes solely to recover presentation.
