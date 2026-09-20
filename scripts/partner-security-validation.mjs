/**
 * Partner application / Control Center authorization probes.
 * Requires the onboarding migration to be applied.
 *
 * Usage:
 *   node --env-file=.env.local scripts/partner-security-validation.mjs
 *
 * Uses only the publishable key + password auth for role accounts created by
 * broker live fixtures when ATLAS_BROKER_E2E_RUN_ID is set; otherwise skips
 * role-specific RPC probes that need seeded users.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const runId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
const password = process.env.ATLAS_BROKER_E2E_PASSWORD ?? "AtlasBroker!2026Aa";

assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL required");
assert.ok(key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY required");

const email = (role) => `atlas-${role}-${runId}@example.com`;

async function login(role) {
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: email(role),
    password,
  });
  assert.equal(error, null, `${role} login failed: ${error?.message}`);
  assert.ok(data.user, `${role} missing user`);
  return client;
}

function deny(label, error) {
  assert.ok(error, `${label}: expected denial`);
  console.log(`PASS deny ${label}`);
}

async function main() {
  // Schema presence
  const anon = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const probe = await anon.from("partner_applications").select("id").limit(1);
  if (probe.error && /schema cache|does not exist|PGRST/i.test(probe.error.message)) {
    console.error("FAIL: partner_applications missing — apply migration first");
    process.exit(2);
  }

  const consumer = await login("consumer");
  const broker = await login("broker-a");
  const admin = await login("admin");

  // Malicious INSERT as consumer
  const malicious = await consumer.from("partner_applications").insert({
    user_id: (await consumer.auth.getUser()).data.user.id,
    first_name: "Attack",
    last_name: "User",
    professional_email: `attack-${runId}@example.com`,
    phone: "+41000000000",
    partner_type: "independent_broker",
    primary_canton: "TI",
    served_cantons: ["TI"],
    languages: ["it"],
    consent_given_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
    status: "approved",
    rejection_reason: "should-not-stick",
    broker_id: "00000000-0000-0000-0000-000000000001",
  }).select("id, status, rejection_reason, broker_id").maybeSingle();

  if (malicious.error) {
    // RLS with check may reject entirely when status=approved — also PASS
    console.log("PASS malicious insert rejected by RLS:", malicious.error.code ?? malicious.error.message);
  } else {
    assert.equal(malicious.data.status, "submitted", "status must be forced to submitted");
    assert.equal(malicious.data.rejection_reason, null, "rejection_reason must be cleared");
    assert.equal(malicious.data.broker_id, null, "broker_id must be cleared");
    console.log("PASS malicious insert sanitized by trigger");
    await consumer.from("partner_applications").delete().eq("id", malicious.data.id);
  }

  // Internal notes table must not be readable by consumer
  const notes = await consumer.from("partner_application_reviews").select("*").limit(1);
  deny("consumer read partner_application_reviews", notes.error || (notes.data?.length ? null : notes.error));
  if (!notes.error) {
    assert.equal((notes.data ?? []).length, 0, "consumer must not see review rows");
    console.log("PASS consumer review rows empty");
  }

  // Audit log
  const auditInsert = await consumer.from("platform_audit_log").insert({
    event_type: "forged",
    target_type: "test",
    metadata: {},
  });
  deny("consumer insert audit", auditInsert.error);

  const auditSelect = await consumer.from("platform_audit_log").select("id").limit(1);
  deny("consumer select audit", auditSelect.error || ((auditSelect.data ?? []).length ? new Error("rows leaked") : auditSelect.error));
  if (!auditSelect.error) {
    assert.equal((auditSelect.data ?? []).length, 0);
    console.log("PASS consumer audit select empty");
  }

  // review RPC denials
  for (const [role, client] of [
    ["consumer", consumer],
    ["broker", broker],
  ]) {
    const { error } = await client.rpc("review_partner_application", {
      p_application_id: "00000000-0000-0000-0000-000000000099",
      p_decision: "approve",
    });
    deny(`${role} review_partner_application`, error);
  }

  // Admin analytics RPCs allowed
  const summary = await admin.rpc("get_control_center_summary", {});
  assert.equal(summary.error, null, summary.error?.message);
  console.log("PASS admin get_control_center_summary");

  const brokerSummary = await broker.rpc("get_control_center_summary", {});
  deny("broker get_control_center_summary", brokerSummary.error);

  const dir = await broker.rpc("get_admin_user_directory");
  deny("broker get_admin_user_directory", dir.error);

  console.log("PASS partner security validation complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
