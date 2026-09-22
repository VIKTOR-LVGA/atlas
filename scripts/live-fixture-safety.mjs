/**
 * Guards live validation scripts from polluting Production.
 *
 * Production project ref (shared historically with Preview/Dev):
 *   ycjltpxxetxvuptwlxlr
 *
 * To intentionally run fixture scripts against Production you MUST set BOTH:
 *   ATLAS_ALLOW_PROD_FIXTURES=1
 *   ATLAS_CLEANUP_AFTER=1
 *
 * Prefer a dedicated staging Supabase project (P2).
 */
import assert from "node:assert/strict";

export const ATLAS_PRODUCTION_PROJECT_REF = "ycjltpxxetxvuptwlxlr";

export function isAtlasProductionUrl(url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") {
  return url.includes(ATLAS_PRODUCTION_PROJECT_REF);
}

/**
 * Call at the top of any script that creates Auth users or business fixtures.
 * Throws unless Production is explicitly opted-in with mandatory cleanup.
 */
export function assertLiveFixtureSafety(scriptName = "validation") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!isAtlasProductionUrl(url)) return;

  const allow = process.env.ATLAS_ALLOW_PROD_FIXTURES === "1";
  const cleanup = process.env.ATLAS_CLEANUP_AFTER === "1";

  assert.ok(
    allow && cleanup,
    [
      `${scriptName}: refused to create fixtures on ATLAS Production.`,
      `Project ${ATLAS_PRODUCTION_PROJECT_REF} is the live shared database.`,
      `Set ATLAS_ALLOW_PROD_FIXTURES=1 and ATLAS_CLEANUP_AFTER=1 only for short, self-cleaning QA runs.`,
      `Prefer a separate staging Supabase project (documented as P2).`,
    ].join(" ")
  );

  console.warn(
    `[${scriptName}] WARNING: running fixtures against Production with mandatory cleanup.`
  );
}

/** Standard recognizable QA email prefix used across ATLAS live scripts. */
export function isAtlasQaEmail(email = "") {
  return /^atlas-(e2e|partner|consumer|broker|admin|qa)-/i.test(email);
}
