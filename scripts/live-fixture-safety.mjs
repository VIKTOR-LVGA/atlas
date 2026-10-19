/**
 * Guards live validation scripts from polluting Production.
 *
 * Production project ref (shared historically with Preview/Dev):
 *   ycjltpxxetxvuptwlxlr
 *
 * To intentionally run fixture scripts against Production you MUST set BOTH:
 *   ATLAS_ALLOW_PROD_FIXTURES=1
 *   ATLAS_CLEANUP_AFTER=1
 *   ATLAS_PROD_BACKUP_VERIFIED=1
 * and provide SUPABASE_SECRET_KEY (preferred) or the legacy
 * SUPABASE_SERVICE_ROLE_KEY for deterministic Auth cleanup.
 *
 * The current controlled run uses the existing Production project only after
 * all recovery and cleanup preconditions have been independently verified.
 */
import assert from "node:assert/strict";

export const ATLAS_PRODUCTION_PROJECT_REF = "ycjltpxxetxvuptwlxlr";

export function getSupabaseAdminKey(env = process.env) {
  return (
    env.SUPABASE_SECRET_KEY?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

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
  const adminKey = getSupabaseAdminKey();

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
      adminKey,
      `${scriptName}: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for staging cleanup.`
    );
    return;
  }

  const allow = process.env.ATLAS_ALLOW_PROD_FIXTURES === "1";
  const cleanup = process.env.ATLAS_CLEANUP_AFTER === "1";
  const backupVerified = process.env.ATLAS_PROD_BACKUP_VERIFIED === "1";

  assert.ok(
    allow && cleanup && backupVerified && adminKey,
    [
      `${scriptName}: refused to create fixtures on ATLAS Production.`,
      `Project ${ATLAS_PRODUCTION_PROJECT_REF} is the live shared database.`,
      `A short, self-cleaning QA run requires ATLAS_ALLOW_PROD_FIXTURES=1, ATLAS_CLEANUP_AFTER=1,`,
      `ATLAS_PROD_BACKUP_VERIFIED=1 and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.`,
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
