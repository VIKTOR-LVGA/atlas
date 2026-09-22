/**
 * Collaboration 1.0 RLS probes — self-cleaning fixtures.
 * Usage:
 *   ATLAS_COLLAB_RUN_ID=collab1 node --env-file=.env.local scripts/collaboration-security-validation.mjs
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { assertLiveFixtureSafety } from "./live-fixture-safety.mjs";

assertLiveFixtureSafety("collaboration-security-validation");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runId = process.env.ATLAS_COLLAB_RUN_ID ?? `collab-${Date.now()}`;
const password = "AtlasCollab!2026Aa";

assert.ok(url && anon, "Supabase env required");
assert.ok(service, "SUPABASE_SERVICE_ROLE_KEY required for role grants + cleanup");

const adminApi = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const client = () =>
  createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

const emails = {
  consumerA: `atlas-collab-ca-${runId}@example.com`,
  consumerB: `atlas-collab-cb-${runId}@example.com`,
  brokerA: `atlas-collab-ba-${runId}@example.com`,
  brokerB: `atlas-collab-bb-${runId}@example.com`,
};

async function ensureUser(email, role) {
  const api = client();
  let { data, error } = await api.auth.signUp({
    email,
    password,
    options: { data: { full_name: email } },
  });
  if (error && /already/i.test(error.message)) {
    ({ data, error } = await api.auth.signInWithPassword({ email, password }));
  }
  assert.equal(error, null, `auth ${email}: ${error?.message}`);
  assert.ok(data.user);
  if (role === "broker" || role === "admin") {
    await adminApi.from("profiles").update({ role }).eq("id", data.user.id);
    // Some installs use user_roles / set via RPC — try both
    await adminApi.rpc("admin_set_user_role", { p_user_id: data.user.id, p_role: role }).then(() => null).catch(() => null);
  }
  return data.user;
}

async function signIn(email) {
  const api = client();
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  assert.equal(error, null, `signin ${email}`);
  return { api, user: data.user };
}

async function cleanup(userIds) {
  for (const id of userIds) {
    if (!id) continue;
    await adminApi.from("consultation_requests").delete().eq("user_id", id);
    await adminApi.from("policies").delete().eq("user_id", id);
    await adminApi.from("documents").delete().eq("user_id", id);
    await adminApi.from("user_activity_events").delete().eq("user_id", id);
    await adminApi.from("brokers").delete().eq("auth_user_id", id);
    await adminApi.auth.admin.deleteUser(id);
  }
}

async function main() {
  const created = [];
  try {
    const ca = await ensureUser(emails.consumerA, "consumer");
    const cb = await ensureUser(emails.consumerB, "consumer");
    const ba = await ensureUser(emails.brokerA, "broker");
    const bb = await ensureUser(emails.brokerB, "broker");
    created.push(ca.id, cb.id, ba.id, bb.id);

    // Ensure broker rows
    for (const [user, label] of [
      [ba, "Collab Broker A"],
      [bb, "Collab Broker B"],
    ]) {
      const { data: existing } = await adminApi
        .from("brokers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!existing) {
        await adminApi.from("brokers").insert({
          auth_user_id: user.id,
          display_name: label,
          company_name: label,
          active: true,
        });
      }
    }

    const consumerA = await signIn(emails.consumerA);
    const consumerB = await signIn(emails.consumerB);
    const brokerA = await signIn(emails.brokerA);
    const brokerB = await signIn(emails.brokerB);

    const { data: brokerARow } = await adminApi
      .from("brokers")
      .select("id")
      .eq("auth_user_id", ba.id)
      .single();

    const { data: policy } = await consumerA.api
      .from("policies")
      .insert({
        user_id: ca.id,
        provider: "Test Insurer",
        policy_type: "motor",
        premium_amount: 1000,
        premium_frequency: "annual",
      })
      .select("id")
      .single();

    const { data: request, error: reqErr } = await consumerA.api
      .from("consultation_requests")
      .insert({
        user_id: ca.id,
        request_type: "portfolio_review",
        message: `collab-${runId}`,
        consent_given_at: new Date().toISOString(),
        privacy_version: "collab-1.0",
        review_reason: "reduce_premium",
        status: "assigned",
        assigned_broker_id: brokerARow.id,
        broker_acceptance: "pending",
      })
      .select("id")
      .single();
    assert.equal(reqErr, null, reqErr?.message);

    await consumerA.api.from("consultation_shared_resources").insert({
      consultation_request_id: request.id,
      user_id: ca.id,
      resource_type: "policy",
      resource_id: policy.id,
    });

    // Consumer A can read own request
    {
      const { data, error } = await consumerA.api
        .from("consultation_requests")
        .select("id")
        .eq("id", request.id)
        .maybeSingle();
      assert.equal(error, null);
      assert.ok(data);
      console.log("PASS consumer A own consultation");
    }

    // Consumer B denied
    {
      const { data } = await consumerB.api
        .from("consultation_requests")
        .select("id")
        .eq("id", request.id)
        .maybeSingle();
      assert.equal(data, null);
      console.log("PASS consumer B denied consultation");
    }

    // Broker A can read assigned
    {
      const { data } = await brokerA.api
        .from("consultation_requests")
        .select("id")
        .eq("id", request.id)
        .maybeSingle();
      assert.ok(data);
      console.log("PASS broker A assigned consultation");
    }

    // Broker B denied
    {
      const { data } = await brokerB.api
        .from("consultation_requests")
        .select("id")
        .eq("id", request.id)
        .maybeSingle();
      assert.equal(data, null);
      console.log("PASS broker B denied consultation");
    }

    // Message insert by broker A
    const { data: msg, error: msgErr } = await brokerA.api
      .from("consultation_messages")
      .insert({
        consultation_request_id: request.id,
        sender_user_id: ba.id,
        sender_role: "broker",
        message_kind: "user",
        body: "ciao collab",
      })
      .select("id")
      .single();
    assert.equal(msgErr, null, msgErr?.message);

    // Broker B cannot read message
    {
      const { data } = await brokerB.api
        .from("consultation_messages")
        .select("id")
        .eq("id", msg.id)
        .maybeSingle();
      assert.equal(data, null);
      console.log("PASS broker B denied message by id");
    }

    // Consumer A reads message
    {
      const { data } = await consumerA.api
        .from("consultation_messages")
        .select("id, body")
        .eq("id", msg.id)
        .maybeSingle();
      assert.ok(data);
      console.log("PASS consumer A reads message");
    }

    // Consumer B denied message
    {
      const { data } = await consumerB.api
        .from("consultation_messages")
        .select("id")
        .eq("id", msg.id)
        .maybeSingle();
      assert.equal(data, null);
      console.log("PASS consumer B denied message");
    }

    // Offer comparison columns exist
    const { data: offer, error: offerErr } = await brokerA.api
      .from("insurance_offers")
      .insert({
        consultation_request_id: request.id,
        broker_id: brokerARow.id,
        insurer: "AXA",
        product: "Test",
        policy_category: "motor",
        premium_amount: 900,
        premium_frequency: "annual",
        source_policy_id: policy.id,
        status: "draft",
      })
      .select("id, source_policy_id")
      .single();
    assert.equal(offerErr, null, offerErr?.message);
    assert.equal(offer.source_policy_id, policy.id);
    console.log("PASS offer with source_policy_id");

    console.log(JSON.stringify({ runId, requestId: request.id }, null, 2));
  } finally {
    await cleanup(created);
    console.log("CLEANUP done");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
