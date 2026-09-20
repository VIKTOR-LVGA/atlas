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

async function loginOrCreateConsumerB() {
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const credentials = { email: email("consumer-b"), password };
  const signedIn = await client.auth.signInWithPassword(credentials);
  if (!signedIn.error && signedIn.data.user) return client;
  const signedUp = await client.auth.signUp({
    ...credentials,
    options: { data: { full_name: `ATLAS consumer B ${runId}` } },
  });
  assert.equal(signedUp.error, null, `consumer-b signup failed: ${signedUp.error?.message}`);
  assert.ok(signedUp.data.session, "consumer-b must receive a live session");
  return client;
}

function deny(label, error) {
  assert.ok(error, `${label}: expected denial`);
  console.log(`PASS deny ${label}`);
}

function hidden(label, result) {
  assert.equal(result.error, null, `${label}: ${result.error?.message}`);
  assert.deepEqual(result.data ?? [], [], `${label}: rows leaked`);
  console.log(`PASS hidden ${label}`);
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
  const consumerB = await loginOrCreateConsumerB();
  const broker = await login("broker-a");
  const brokerB = await login("broker-b");
  const admin = await login("admin");

  for (const [label, client, expectedRole] of [
    ["consumer-a", consumer, "consumer"],
    ["consumer-b", consumerB, "consumer"],
    ["broker-a", broker, "broker"],
    ["broker-b", brokerB, "broker"],
    ["admin", admin, "admin"],
  ]) {
    const role = await client.rpc("current_user_role");
    assert.equal(role.error, null, `${label} role lookup failed`);
    assert.equal(role.data, expectedRole, `${label} role mismatch`);
  }
  console.log("PASS five independent role identities");

  // Malicious INSERT as a dedicated second consumer.
  const consumerBId = (await consumerB.auth.getUser()).data.user.id;
  let malicious = await consumerB.from("partner_applications").insert({
    user_id: consumerBId,
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

  if (malicious.error?.code === "23505") {
    malicious = await consumerB
      .from("partner_applications")
      .select("id, status, rejection_reason, broker_id")
      .eq("user_id", consumerBId)
      .single();
  }
  assert.equal(malicious.error, null, malicious.error?.message);
  assert.equal(malicious.data.status, "submitted", "status must be forced to submitted");
  assert.equal(malicious.data.rejection_reason, null, "rejection_reason must be cleared");
  assert.equal(malicious.data.broker_id, null, "broker_id must be cleared");
  console.log("PASS malicious insert sanitized by trigger");

  const maliciousUpdate = await consumerB
    .from("partner_applications")
    .update({ status: "approved", broker_id: "00000000-0000-0000-0000-000000000001" })
    .eq("id", malicious.data.id)
    .select("id");
  assert.equal(maliciousUpdate.error, null, maliciousUpdate.error?.message);
  assert.deepEqual(maliciousUpdate.data, [], "locked application update must affect no rows");
  const afterUpdate = await consumerB
    .from("partner_applications")
    .select("status, rejection_reason, broker_id")
    .eq("id", malicious.data.id)
    .single();
  assert.equal(afterUpdate.data.status, "submitted");
  assert.equal(afterUpdate.data.broker_id, null);
  console.log("PASS malicious update cannot approve or attach a broker");

  const internalColumnAttempt = await consumerB.from("partner_applications").insert({
    user_id: consumerBId,
    first_name: "Attack",
    last_name: "Internal",
    professional_email: `internal-${runId}@example.com`,
    phone: "+41000000000",
    primary_canton: "TI",
    consent_given_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
    admin_notes: "forged",
    reviewed_by: consumerBId,
    reviewed_at: new Date().toISOString(),
  });
  deny("consumer inserts removed internal review columns", internalColumnAttempt.error);

  const consumerAApplication = await consumer
    .from("partner_applications")
    .select("id")
    .eq("user_id", consumerBId);
  hidden("consumer A cannot read consumer B application", consumerAApplication);

  // Internal notes table must not be readable by consumer
  const notes = await consumer.from("partner_application_reviews").select("*").limit(1);
  hidden("consumer partner_application_reviews", notes);

  // Audit log
  const auditInsert = await consumer.from("platform_audit_log").insert({
    event_type: "forged",
    target_type: "test",
    metadata: {},
  });
  deny("consumer insert audit", auditInsert.error);

  const auditSelect = await consumer.from("platform_audit_log").select("id").limit(1);
  hidden("consumer platform_audit_log", auditSelect);

  const brokerAudit = await broker.from("platform_audit_log").select("id").limit(1);
  hidden("broker platform_audit_log", brokerAudit);

  const auditUpdate = await consumer
    .from("platform_audit_log")
    .update({ event_type: "forged" })
    .eq("id", "00000000-0000-0000-0000-000000000099");
  deny("consumer update audit", auditUpdate.error);

  const auditDelete = await consumer
    .from("platform_audit_log")
    .delete()
    .eq("id", "00000000-0000-0000-0000-000000000099");
  deny("consumer delete audit", auditDelete.error);

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

    const active = await client.rpc("set_broker_active", {
      p_broker_id: "00000000-0000-0000-0000-000000000099",
      p_active: false,
    });
    deny(`${role} set_broker_active`, active.error);

    const roleMutation = await client.rpc("set_user_role", {
      p_user_id: "00000000-0000-0000-0000-000000000099",
      p_role: "admin",
    });
    deny(`${role} set_user_role`, roleMutation.error);

    const reviewWrite = await client.rpc("upsert_partner_application_review", {
      p_application_id: "00000000-0000-0000-0000-000000000099",
      p_admin_notes: "forged",
    });
    deny(`${role} upsert review`, reviewWrite.error);

    const cantonProbe = await client.rpc("user_primary_canton", {
      p_user_id: "00000000-0000-0000-0000-000000000099",
    });
    deny(`${role} arbitrary canton probe`, cantonProbe.error);
  }

  // Admin analytics RPCs allowed
  const summary = await admin.rpc("get_control_center_summary", {});
  assert.equal(summary.error, null, summary.error?.message);
  console.log("PASS admin get_control_center_summary");

  const brokerSummary = await broker.rpc("get_control_center_summary", {});
  deny("broker get_control_center_summary", brokerSummary.error);

  for (const [name, args] of [
    ["get_admin_user_directory", undefined],
    ["get_platform_engagement_funnel", undefined],
    ["get_platform_growth_series", { p_months: 3 }],
    ["get_canton_aggregates", { p_scope: "admin", p_broker_id: null }],
  ]) {
    const result = args ? await broker.rpc(name, args) : await broker.rpc(name);
    deny(`broker ${name}`, result.error);
    const consumerResult = args ? await consumer.rpc(name, args) : await consumer.rpc(name);
    deny(`consumer ${name}`, consumerResult.error);
  }

  const partnerCantons = await broker.rpc("get_canton_aggregates", {
    p_scope: "partner",
    p_broker_id: "00000000-0000-0000-0000-000000000099",
  });
  assert.equal(partnerCantons.error, null, partnerCantons.error?.message);
  for (const row of partnerCantons.data ?? []) {
    assert.equal(Number(row.atlas_revenue ?? 0), 0, "partner RPC leaked ATLAS revenue");
    if (Number(row.clients ?? 0) < 3) {
      assert.equal(row.privacy_masked, true);
      assert.equal(Number(row.broker_revenue ?? 0), 0);
      assert.equal(Number(row.gross_commission ?? 0), 0);
    }
  }
  console.log("PASS partner canton scope, threshold and ATLAS revenue isolation");

  const adminAudit = await admin.from("platform_audit_log").select("id").limit(1);
  assert.equal(adminAudit.error, null, adminAudit.error?.message);
  console.log("PASS admin audit read");

  console.log("PASS partner security validation complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
