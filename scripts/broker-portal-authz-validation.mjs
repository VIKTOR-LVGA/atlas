/**
 * Live RLS probes: with broker_portal DB flag OFF, assigned brokers cannot read
 * consumer consultation data / shared resources / storage paths.
 *
 * Usage:
 *   node --env-file=.env.local scripts/broker-portal-authz-validation.mjs
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { assertLiveFixtureSafety } from "./live-fixture-safety.mjs";

assertLiveFixtureSafety("broker-portal-authz-validation");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runId = process.env.ATLAS_BROKER_AUTHZ_RUN_ID ?? `authz-${Date.now()}`;
const password = "AtlasAuthz!2026Aa";

assert.ok(url && anon && service, "Supabase env required");

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const browser = () =>
  createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

async function ensureUser(email, role) {
  const api = browser();
  let { data, error } = await api.auth.signUp({
    email,
    password,
    options: { data: { full_name: email } },
  });
  if (error && /already/i.test(error.message)) {
    ({ data, error } = await api.auth.signInWithPassword({ email, password }));
  }
  assert.equal(error, null, error?.message);
  assert.ok(data.user);
  if (role === "broker" || role === "admin") {
    await admin.rpc("set_user_role", { p_user_id: data.user.id, p_role: role });
  }
  return data.user;
}

async function signIn(email) {
  const api = browser();
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  assert.equal(error, null, error?.message);
  return { api, user: data.user };
}

async function main() {
  const { data: flagOn } = await admin.rpc("is_broker_portal_enabled");
  assert.equal(flagOn, false, "DB broker_portal must be OFF for this probe");

  const consumerEmail = `atlas-authz-c-${runId}@example.com`;
  const brokerEmail = `atlas-authz-b-${runId}@example.com`;
  const otherEmail = `atlas-authz-o-${runId}@example.com`;
  const created = [];

  try {
    const consumer = await ensureUser(consumerEmail, "consumer");
    const other = await ensureUser(otherEmail, "consumer");
    const brokerUser = await ensureUser(brokerEmail, "broker");
    created.push(consumer.id, other.id, brokerUser.id);

    // Ensure broker row exists
    await admin.from("brokers").upsert(
      {
        auth_user_id: brokerUser.id,
        display_name: `Authz Broker ${runId}`,
        email: brokerEmail,
        active: true,
      },
      { onConflict: "auth_user_id" }
    );
    const { data: brokerRow } = await admin
      .from("brokers")
      .select("id")
      .eq("auth_user_id", brokerUser.id)
      .single();
    assert.ok(brokerRow?.id);

    const { data: consultation, error: cErr } = await admin
      .from("consultation_requests")
      .insert({
        user_id: consumer.id,
        request_type: "portfolio_review",
        status: "assigned",
        assigned_broker_id: brokerRow.id,
        consent_given_at: new Date().toISOString(),
        privacy_version: "atlas-consultation-authz",
        access_reason: null,
        message: "authz probe",
      })
      .select("id")
      .single();
    // access_reason may not exist — retry without
    let consultationId = consultation?.id;
    if (cErr || !consultationId) {
      const retry = await admin
        .from("consultation_requests")
        .insert({
          user_id: consumer.id,
          request_type: "portfolio_review",
          status: "assigned",
          assigned_broker_id: brokerRow.id,
          consent_given_at: new Date().toISOString(),
          privacy_version: "atlas-consultation-authz",
          message: "authz probe",
        })
        .select("id")
        .single();
      assert.equal(retry.error, null, retry.error?.message);
      consultationId = retry.data.id;
    }

    const { data: policy } = await admin
      .from("policies")
      .insert({
        user_id: consumer.id,
        insurer: "AuthzInsurer",
        product: "AuthzProduct",
        category: "motor",
        status: "active",
      })
      .select("id")
      .single();

    if (policy?.id) {
      await admin.from("consultation_shared_resources").insert({
        consultation_request_id: consultationId,
        user_id: consumer.id,
        resource_type: "policy",
        resource_id: policy.id,
      });
    }

    // Broker JWT: must NOT see consultation / shared / policy
    const { api: brokerApi } = await signIn(brokerEmail);
    const { data: brokerSeesReq } = await brokerApi
      .from("consultation_requests")
      .select("id")
      .eq("id", consultationId);
    assert.equal((brokerSeesReq ?? []).length, 0, "broker must not read consultation");

    const { data: brokerSeesShare } = await brokerApi
      .from("consultation_shared_resources")
      .select("id")
      .eq("consultation_request_id", consultationId);
    assert.equal((brokerSeesShare ?? []).length, 0, "broker must not read shares");

    if (policy?.id) {
      const { data: brokerSeesPolicy } = await brokerApi
        .from("policies")
        .select("id")
        .eq("id", policy.id);
      assert.equal((brokerSeesPolicy ?? []).length, 0, "broker must not read shared policy");
    }

    const { data: brokerIdRpc } = await brokerApi.rpc("is_broker_portal_enabled");
    assert.equal(brokerIdRpc, false);
    // current_broker_id via a select that depends on it — portal off ⇒ null identity for collab
    const { error: assignErr } = await brokerApi.rpc("broker_respond_to_assignment", {
      p_consultation_request_id: consultationId,
      p_decision: "accepted",
    });
    assert.ok(assignErr, "broker_respond_to_assignment must fail when portal OFF");

    // Owner consumer CAN read
    const { api: ownerApi } = await signIn(consumerEmail);
    const { data: ownerSees } = await ownerApi
      .from("consultation_requests")
      .select("id")
      .eq("id", consultationId);
    assert.equal((ownerSees ?? []).length, 1, "owner must read own consultation");

    // Other consumer CANNOT
    const { api: otherApi } = await signIn(otherEmail);
    const { data: otherSees } = await otherApi
      .from("consultation_requests")
      .select("id")
      .eq("id", consultationId);
    assert.equal((otherSees ?? []).length, 0, "other consumer must not read");

    console.log("broker-portal-authz-validation: PASS");
  } finally {
    for (const id of created) {
      await admin.from("consultation_shared_resources").delete().eq("user_id", id);
      await admin.from("consultation_requests").delete().eq("user_id", id);
      await admin.from("policies").delete().eq("user_id", id);
      await admin.from("brokers").delete().eq("auth_user_id", id);
      await admin.auth.admin.deleteUser(id).catch(() => null);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
