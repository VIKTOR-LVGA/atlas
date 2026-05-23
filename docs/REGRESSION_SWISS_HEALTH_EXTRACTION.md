# Swiss health extraction — regression (generic)

## Fixture

`lib/health-grouping-regression.ts` models a **two-person family health PDF** (layout typical of Swiss KVG/LCA statements, used as Helsana regression example).

Run:

```bash
npx --yes tsx lib/health-grouping-regression.ts
```

## Expected behavior

1. **Two insured people** in `insured_people[]`
2. **Family contract total** preserved (`759.35` CHF) — not attached as a person line
3. **Product premiums** preserved per line
4. **Ownership**: WORLD → Armir; COMPLETA, HOSPITAL Privato, Advocare EXTRA → Lorik; base PREMED-24 → Armir; base BeneFit PLUS → Lorik
5. **Unassigned** minimal (≤ 2 in fixture); no duplicate lines in both assigned and unassigned
6. **Person totals** approximately match sum of assigned lines

## Manual test (any Swiss insurer)

1. Upload PDF → Analyze
2. Open policy detail
3. Confirm **Persone assicurate** is the primary section
4. Re-analyze after engine changes to refresh OpenAI output

## Not in scope

- Insurer-specific hardcoding
- OCR
- DB schema migrations
