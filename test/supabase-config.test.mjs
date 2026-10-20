import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getSupabaseConfig } from "../lib/supabase/config.ts";

const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));

afterEach(() => {
  for (const name of names) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
});

function configure({ url = "https://example.supabase.co", anon, publishable } = {}) {
  for (const name of names) delete process.env[name];
  if (url !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  if (anon !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anon;
  if (publishable !== undefined) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishable;
}

test("accepts Vercel's publishable key without a legacy anon key", () => {
  configure({ publishable: "sb_publishable_test" });
  assert.deepEqual(getSupabaseConfig(), { url: "https://example.supabase.co", anonKey: "sb_publishable_test" });
});

test("keeps legacy local anon key configuration working", () => {
  configure({ anon: "legacy-test-key" });
  assert.equal(getSupabaseConfig().anonKey, "legacy-test-key");
});

test("prefers the publishable key when both are configured", () => {
  configure({ publishable: "sb_publishable_test", anon: "legacy-test-key" });
  assert.equal(getSupabaseConfig().anonKey, "sb_publishable_test");
});

test("falls back to anon when publishable is blank", () => {
  configure({ publishable: "  ", anon: "legacy-test-key" });
  assert.equal(getSupabaseConfig().anonKey, "legacy-test-key");
});

test("rejects missing keys without exposing their contents", () => {
  configure();
  assert.throws(getSupabaseConfig, /Missing Supabase environment variables/);
});

test("rejects a missing URL", () => {
  configure({ url: "", publishable: "sb_publishable_test" });
  assert.throws(getSupabaseConfig, /Missing Supabase environment variables/);
});
