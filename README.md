# Atlas

Atlas is a Swiss insurance intelligence SaaS built with Next.js App Router,
TypeScript, Tailwind, Supabase Auth/Storage, and AI-assisted policy extraction.

## Environment

Create a root `.env.local` file with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

OPENAI_API_KEY=your-openai-api-key
OPENAI_POLICY_EXTRACTION_MODEL=gpt-5.2
OPENAI_POLICY_EXTRACTION_MODEL_STRONG=gpt-5.2
OPENAI_POLICY_EXTRACTION_MODEL_FAST=gpt-5.2
OPENAI_POLICY_EXTRACTION_FALLBACK_MODE=hard_failure_only
OPENAI_POLICY_EXTRACTION_MAX_INPUT_CHARS=32000
OPENAI_POLICY_EXTRACTION_CONFIDENCE_FALLBACK=42
```

Atlas prioritizes **extraction quality over speed**. By default, analysis uses the
**strong** model (`OPENAI_POLICY_EXTRACTION_MODEL_STRONG` or
`OPENAI_POLICY_EXTRACTION_MODEL`). It does **not** silently use `gpt-4.1-mini`.

Optional faster (lower-accuracy) first pass — only when you explicitly opt in:

```bash
OPENAI_POLICY_EXTRACTION_USE_FAST_MODEL=true
OPENAI_POLICY_EXTRACTION_MODEL_FAST=gpt-4.1-mini
```

`OPENAI_POLICY_EXTRACTION_FALLBACK_MODE` defaults to `hard_failure_only` (retry
strong on API/parse/refusal failures when fast-first is enabled and models differ).
Set `quality_gate` to also retry on sparse/low-confidence fast results.
`OPENAI_POLICY_EXTRACTION_CONFIDENCE_FALLBACK` applies only in `quality_gate` mode.

`OPENAI_API_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## AI extraction

Document analysis uses OpenAI structured outputs on the server. Private PDFs
are downloaded from Supabase Storage, readable text is extracted when possible,
and successful runs save an `ai_draft` policy that requires review.

In **production**, a PDF without enough readable text for non-OCR extraction
**fails cleanly** with a user-facing error — Atlas does **not** create mock or
fallback policy drafts.

For **local development only**, optional mock extraction is available when both
are set: `NODE_ENV=development` and `ENABLE_DEV_MOCK_EXTRACTION=true`.

Redacted extraction quality summary (development only, no names/premiums/raw text):

```bash
ATLAS_DEBUG_EXTRACTION_SUMMARY=true
```

## Useful commands

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:migrations
npm run test:intelligence
npm run test:financial
npm run test:knowledge
npm run test:pilot
```

## Environments

See `docs/environment-separation.md`. Prefer Staging/local Supabase for fixtures.
Never commit secrets. Production service role belongs only in Vercel Production.

## Architecture & ops

- `docs/architecture.md`
- `docs/pilot/operations.md`
- `docs/pilot/readiness-checklist.md`
- `docs/operations/incident-runbook.md`
- `docs/privacy/data-map.md`

## Deploy on Vercel

Set Production env vars in Vercel. Configure `CRON_SECRET` for daily Intelligence snapshots
(`vercel.json` cron → `/api/cron/intelligence-snapshots`).
