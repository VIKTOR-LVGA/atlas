import assert from "node:assert/strict";
import {
  assertLiveFixtureSafety,
  getSupabaseProjectRef,
} from "../scripts/live-fixture-safety.mjs";

const original = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  stagingRef: process.env.ATLAS_STAGING_PROJECT_REF,
  cleanup: process.env.ATLAS_CLEANUP_AFTER,
  allowProduction: process.env.ATLAS_ALLOW_PROD_FIXTURES,
  backupVerified: process.env.ATLAS_PROD_BACKUP_VERIFIED,
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function setEnvironment(values) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

try {
  assert.equal(
    getSupabaseProjectRef("https://abcdefghijklmnopqrst.supabase.co"),
    "abcdefghijklmnopqrst"
  );

  setEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "https://stagingabcdefghijkl.supabase.co",
    ATLAS_STAGING_PROJECT_REF: undefined,
    ATLAS_CLEANUP_AFTER: "1",
    ATLAS_ALLOW_PROD_FIXTURES: undefined,
    ATLAS_PROD_BACKUP_VERIFIED: undefined,
    SUPABASE_SERVICE_ROLE_KEY: "staging-service-role-test-value",
  });
  assert.throws(
    () => assertLiveFixtureSafety("test"),
    /ATLAS_STAGING_PROJECT_REF is required/
  );

  process.env.ATLAS_STAGING_PROJECT_REF = "differentrefabcdefgh";
  assert.throws(
    () => assertLiveFixtureSafety("test"),
    /does not match the approved staging project ref/
  );

  process.env.ATLAS_STAGING_PROJECT_REF = "stagingabcdefghijkl";
  assert.doesNotThrow(() => assertLiveFixtureSafety("test"));

  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(
    () => assertLiveFixtureSafety("test"),
    /SUPABASE_SERVICE_ROLE_KEY is required/
  );

  setEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "https://ycjltpxxetxvuptwlxlr.supabase.co",
    ATLAS_STAGING_PROJECT_REF: "ycjltpxxetxvuptwlxlr",
    ATLAS_CLEANUP_AFTER: "1",
    ATLAS_ALLOW_PROD_FIXTURES: undefined,
    ATLAS_PROD_BACKUP_VERIFIED: undefined,
    SUPABASE_SERVICE_ROLE_KEY: "staging-service-role-test-value",
  });
  assert.throws(
    () => assertLiveFixtureSafety("test"),
    /refused to create fixtures on ATLAS Production/
  );

  process.env.ATLAS_ALLOW_PROD_FIXTURES = "1";
  process.env.ATLAS_PROD_BACKUP_VERIFIED = "1";
  assert.doesNotThrow(() => assertLiveFixtureSafety("test"));

  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(
    () => assertLiveFixtureSafety("test"),
    /SUPABASE_SERVICE_ROLE_KEY/
  );

  console.info("PASS live fixture environment safety");
} finally {
  setEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: original.url,
    ATLAS_STAGING_PROJECT_REF: original.stagingRef,
    ATLAS_CLEANUP_AFTER: original.cleanup,
    ATLAS_ALLOW_PROD_FIXTURES: original.allowProduction,
    ATLAS_PROD_BACKUP_VERIFIED: original.backupVerified,
    SUPABASE_SERVICE_ROLE_KEY: original.serviceRole,
  });
}
