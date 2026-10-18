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

export function getSupabaseProjectRef(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null;
  } catch {
    return null;
  }
}

/**
 * Call at the top of any script that creates Auth users or business fixtures.
 * Throws unless Production is explicitly opted-in with mandatory cleanup.
 */
export function assertLiveFixtureSafety(scriptName = "validation") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = getSupabaseProjectRef(url);

  if (!projectRef) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) {
      return;
    }

    assert.fail(`${scriptName}: invalid or missing Supabase URL.`);
  }

  if (!isAtlasProductionUrl(url)) {
    const expectedStagingRef = process.env.ATLAS_STAGING_PROJECT_REF?.trim();

    assert.ok(
      expectedStagingRef,
      `${scriptName}: ATLAS_STAGING_PROJECT_REF is required for remote fixture runs.`
    );
    assert.equal(
      projectRef,
      expectedStagingRef,
      `${scriptName}: Supabase URL does not match the approved staging project ref.`
    );
    assert.equal(
      process.env.ATLAS_CLEANUP_AFTER,
      "1",
      `${scriptName}: staging fixture runs require ATLAS_CLEANUP_AFTER=1.`
    );
    assert.ok(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      `${scriptName}: SUPABASE_SERVICE_ROLE_KEY is required for staging cleanup.`
    );
    return;
  }

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
