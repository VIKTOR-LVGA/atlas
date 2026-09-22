/**
 * Full collaboration RLS + happy-path validation (self-cleaning).
 *
 * Usage:
 *   ATLAS_ALLOW_PROD_FIXTURES=1 ATLAS_CLEANUP_AFTER=1 \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node --env-file=.env.local --env-file=/tmp/atlas-sr.env \
 *     scripts/collaboration-finalization-qa.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertLiveFixtureSafety } from "./live-fixture-safety.mjs";

assertLiveFixtureSafety("collaboration-finalization-qa");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runId = process.env.ATLAS_COLLAB_FINAL_RUN_ID ?? `cf-${Date.now()}`;
const password = "AtlasCollabFinal!2026Aa";

assert.ok(url && anon, "Supabase public env required");
assert.ok(service, "SUPABASE_SERVICE_ROLE_KEY required");

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const client = () =>
  createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

const emails = {
  ca: `atlas-cf-ca-${runId}@example.com`,
  cb: `atlas-cf-cb-${runId}@example.com`,
  ba: `atlas-cf-ba-${runId}@example.com`,
  bb: `atlas-cf-bb-${runId}@example.com`,
  intel: `atlas-cf-intel-${runId}@example.com`,
};

const createdUserIds = [];
const storagePaths = [];

async function ensureUser(email) {
  const api = client();
  let { data, error } = await api.auth.signUp({
    email,
    password,
    options: { data: { full_name: email } },
  });
  if (error && /already|registered/i.test(error.message)) {
    ({ data, error } = await api.auth.signInWithPassword({ email, password }));
  }
  assert.equal(error, null, `auth ${email}: ${error?.message}`);
  assert.ok(data.user);
  createdUserIds.push(data.user.id);
  return data.user;
}

async function signIn(email) {
  const api = client();
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  assert.equal(error, null, `signin ${email}`);
  return { api, user: data.user };
}

async function setRole(userId, role) {
  const { error } = await admin.from("user_roles").upsert(
    { user_id: userId, role },
    { onConflict: "user_id" }
  );
  assert.equal(error, null, `setRole ${role}: ${error?.message}`);
}

async function ensureBroker(userId, label, email) {
  const { data: existing } = await admin
    .from("brokers")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await admin
    .from("brokers")
    .insert({
      auth_user_id: userId,
      display_name: label,
      organization_name: label,
      email,
      active: true,
    })
    .select("id")
    .single();
  assert.equal(error, null, `broker insert: ${error?.message}`);
  return data.id;
}

function minimalPdfBytes() {
  // Tiny valid-ish PDF with quote keywords for classifier (no PII)
  const body = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 180 >>stream
BT /F1 12 Tf 20 100 Td (Preventivo assicurativo ANONIMO) Tj 0 -18 Td (Compagnia: Helvetia Test) Tj 0 -18 Td (Premio annuo CHF 1640.00) Tj 0 -18 Td (Offerta valida fino 31.12.2099) Tj ET
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000500 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
580
%%EOF`;
  return Buffer.from(body, "utf8");
}

async function cleanup() {
  for (const path of storagePaths) {
    await admin.storage.from("policy-documents").remove([path]);
  }
  for (const id of [...new Set(createdUserIds)]) {
    await admin.from("consultation_requests").delete().eq("user_id", id);
    await admin.from("policies").delete().eq("user_id", id);
    await admin.from("documents").delete().eq("user_id", id);
    await admin.from("user_activity_events").delete().eq("user_id", id);
    await admin.from("switch_events").delete().eq("consumer_user_id", id);
    await admin.from("brokers").delete().eq("auth_user_id", id);
    await admin.from("user_roles").delete().eq("user_id", id);
    await admin.from("intelligence_memberships").delete().eq("user_id", id);
    await admin.auth.admin.deleteUser(id);
  }
  console.log("CLEANUP complete", { users: createdUserIds.length, storage: storagePaths.length });
}

async function main() {
  try {
    const ca = await ensureUser(emails.ca);
    const cb = await ensureUser(emails.cb);
    const ba = await ensureUser(emails.ba);
    const bb = await ensureUser(emails.bb);
    const intel = await ensureUser(emails.intel);

    await setRole(ca.id, "consumer");
    await setRole(cb.id, "consumer");
    await setRole(ba.id, "broker");
    await setRole(bb.id, "broker");
    await setRole(intel.id, "consumer");

    const brokerAId = await ensureBroker(ba.id, `CF Broker A ${runId}`, emails.ba);
    const brokerBId = await ensureBroker(bb.id, `CF Broker B ${runId}`, emails.bb);

    const consumerA = await signIn(emails.ca);
    const consumerB = await signIn(emails.cb);
    const brokerA = await signIn(emails.ba);
    const brokerB = await signIn(emails.bb);
    const intelUser = await signIn(emails.intel);

    const { data: policy, error: policyErr } = await admin
      .from("policies")
      .insert({
        user_id: ca.id,
        provider: "Zurich Test",
        policy_type: "car",
        premium_amount: 1873.1,
        premium_frequency: "annual",
        deductible: 1000,
      })
      .select("id")
      .single();
    assert.equal(policyErr, null, policyErr?.message);

    const { data: request, error: reqErr } = await admin
      .from("consultation_requests")
      .insert({
        user_id: ca.id,
        request_type: "portfolio_review",
        message: `final-${runId}`,
        consent_given_at: new Date().toISOString(),
        privacy_version: "collab-final-1.0",
        review_reason: "reduce_premium",
        status: "submitted",
      })
      .select("id")
      .single();
    assert.equal(reqErr, null, reqErr?.message);

    const { error: shareErr } = await admin.from("consultation_shared_resources").insert({
      consultation_request_id: request.id,
      user_id: ca.id,
      resource_type: "policy",
      resource_id: policy.id,
    });
    assert.equal(shareErr, null, shareErr?.message);

    // Admin assigns Broker A
    const { error: assignErr } = await admin
      .from("consultation_requests")
      .update({
        status: "assigned",
        assigned_broker_id: brokerAId,
        broker_acceptance: "pending",
      })
      .eq("id", request.id);
    assert.equal(assignErr, null, assignErr?.message);
    // --- RLS matrix ---
    assert.ok(
      (
        await consumerA.api
          .from("consultation_requests")
          .select("id")
          .eq("id", request.id)
          .maybeSingle()
      ).data
    );
    console.log("PASS Consumer A → own consultation");

    assert.equal(
      (
        await consumerB.api
          .from("consultation_requests")
          .select("id")
          .eq("id", request.id)
          .maybeSingle()
      ).data,
      null
    );
    console.log("PASS Consumer A → Consumer B denied");

    assert.ok(
      (
        await brokerA.api
          .from("consultation_requests")
          .select("id")
          .eq("id", request.id)
          .maybeSingle()
      ).data
    );
    console.log("PASS Broker A → assigned");

    assert.equal(
      (
        await brokerB.api
          .from("consultation_requests")
          .select("id")
          .eq("id", request.id)
          .maybeSingle()
      ).data,
      null
    );
    console.log("PASS Broker B → Broker A denied");

    assert.equal(
      (
        await intelUser.api
          .from("consultation_requests")
          .select("id")
          .eq("id", request.id)
          .maybeSingle()
      ).data,
      null
    );
    console.log("PASS Intelligence → raw consultation denied");

    // Accept assignment
    const { error: acceptErr } = await brokerA.api.rpc("broker_respond_to_assignment", {
      p_consultation_request_id: request.id,
      p_decision: "accepted",
      p_reason: null,
    });
    assert.equal(acceptErr, null, acceptErr?.message);
    console.log("PASS Broker A accept");

    // Messaging
    const { data: msg, error: msgErr } = await brokerA.api
      .from("consultation_messages")
      .insert({
        consultation_request_id: request.id,
        sender_user_id: ba.id,
        sender_role: "broker",
        message_kind: "user",
        body: "Messaggio collab final",
      })
      .select("id")
      .single();
    assert.equal(msgErr, null, msgErr?.message);
    assert.equal(
      (
        await brokerB.api
          .from("consultation_messages")
          .select("id")
          .eq("id", msg.id)
          .maybeSingle()
      ).data,
      null
    );
    console.log("PASS message Broker B denied by id");

    const { error: cmsgErr } = await consumerA.api.from("consultation_messages").insert({
      consultation_request_id: request.id,
      sender_user_id: ca.id,
      sender_role: "consumer",
      message_kind: "user",
      body: "Risposta cliente",
    });
    assert.equal(cmsgErr, null, cmsgErr?.message);
    console.log("PASS consumer message");

    // Appointment propose / counter / confirm
    const when = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const { data: appt, error: apptErr } = await brokerA.api
      .from("consultation_appointments")
      .insert({
        consultation_request_id: request.id,
        broker_id: brokerAId,
        scheduled_at: when,
        duration_minutes: 45,
        channel: "video",
        status: "proposed",
        proposal_status: "pending",
        proposed_by: "broker",
      })
      .select("id")
      .single();
    assert.equal(apptErr, null, apptErr?.message);

    const counter = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString();
    const { error: counterErr } = await consumerA.api
      .from("consultation_appointments")
      .update({
        scheduled_at: counter,
        status: "counter_proposed",
        proposed_by: "consumer",
      })
      .eq("id", appt.id);
    assert.equal(counterErr, null, counterErr?.message);

    assert.equal(
      (
        await brokerB.api
          .from("consultation_appointments")
          .update({ status: "confirmed" })
          .eq("id", appt.id)
          .select("id")
      ).data?.length ?? 0,
      0
    );
    console.log("PASS appointment Broker B cannot modify");

    const { error: confErr } = await brokerA.api
      .from("consultation_appointments")
      .update({ status: "confirmed", proposal_status: "accepted" })
      .eq("id", appt.id);
    assert.equal(confErr, null, confErr?.message);
    console.log("PASS appointment confirmed");

    // Offer draft + PDF
    const { data: offer, error: offerErr } = await brokerA.api
      .from("insurance_offers")
      .insert({
        consultation_request_id: request.id,
        broker_id: brokerAId,
        insurer: "Helvetia Test",
        product: "Motor Quote",
        policy_category: "car",
        premium_amount: 1640,
        premium_frequency: "annual",
        source_policy_id: policy.id,
        status: "draft",
        currency: "CHF",
      })
      .select("id")
      .single();
    assert.equal(offerErr, null, offerErr?.message);

    const pdf = minimalPdfBytes();
    const hash = createHash("sha256").update(pdf).digest("hex");
    const filePath = `quotes/${request.id}/${offer.id}-${hash.slice(0, 12)}.pdf`;
    storagePaths.push(filePath);
    const { error: upErr } = await brokerA.api.storage
      .from("policy-documents")
      .upload(filePath, pdf, { contentType: "application/pdf", upsert: false });
    assert.equal(upErr, null, upErr?.message);

    const { error: regErr } = await brokerA.api.rpc("broker_register_offer_quote_document", {
      p_consultation_id: request.id,
      p_offer_id: offer.id,
      p_file_name: "anon-quote.pdf",
      p_file_path: filePath,
      p_file_size: pdf.length,
      p_mime_type: "application/pdf",
      p_file_hash: hash,
    });
    assert.equal(regErr, null, regErr?.message);
    console.log("PASS offer PDF register");

    // Manual verify (extraction may be optional in script)
    const { error: verifyErr } = await brokerA.api
      .from("insurance_offers")
      .update({
        extraction_status: "ready_to_send",
        verified_at: new Date().toISOString(),
        verified_by: ba.id,
        source_policy_id: policy.id,
        insurer: "Helvetia Test",
        product: "Motor Quote",
        premium_amount: 1640,
      })
      .eq("id", offer.id);
    assert.equal(verifyErr, null, verifyErr?.message);

    const { error: sendErr } = await brokerA.api
      .from("insurance_offers")
      .update({ status: "sent", proposed_at: new Date().toISOString() })
      .eq("id", offer.id);
    assert.equal(sendErr, null, sendErr?.message);
    console.log("PASS offer sent");

    // Immutability
    const { error: mutateErr } = await brokerA.api
      .from("insurance_offers")
      .update({ premium_amount: 1 })
      .eq("id", offer.id);
    assert.ok(mutateErr, "expected immutability error");
    console.log("PASS sent offer immutability");

    // Revision
    const { data: revId, error: revErr } = await brokerA.api.rpc(
      "create_insurance_offer_revision",
      { p_offer_id: offer.id }
    );
    assert.equal(revErr, null, revErr?.message);
    const { data: v1 } = await brokerA.api
      .from("insurance_offers")
      .select("premium_amount, is_current, version")
      .eq("id", offer.id)
      .single();
    assert.equal(Number(v1.premium_amount), 1640);
    assert.equal(v1.is_current, false);
    console.log("PASS revision keeps V1 unchanged", { revId });

    // Consumer sees sent offer (V1 still readable; current is V2 draft)
    assert.ok(
      (
        await consumerA.api
          .from("insurance_offers")
          .select("id")
          .eq("id", offer.id)
          .maybeSingle()
      ).data
    );
    assert.equal(
      (
        await consumerB.api
          .from("insurance_offers")
          .select("id")
          .eq("id", offer.id)
          .maybeSingle()
      ).data,
      null
    );
    console.log("PASS offer consumer isolation");

    // Decision on V1
    await consumerA.api
      .from("insurance_offers")
      .update({
        status: "interested",
        consumer_decision: "interested",
        consumer_decision_at: new Date().toISOString(),
        decision_offer_version: 1,
      })
      .eq("id", offer.id);
    const { data: v2 } = await brokerA.api
      .from("insurance_offers")
      .select("id, consumer_decision, version")
      .eq("id", revId)
      .single();
    assert.equal(v2.consumer_decision, null);
    console.log("PASS decision version binding (V2 unaffected)");

    // Close + revoke shares
    await admin
      .from("consultation_requests")
      .update({ status: "completed", closed_at: new Date().toISOString() })
      .eq("id", request.id);
    const { data: shares } = await admin
      .from("consultation_shared_resources")
      .select("revoked_at")
      .eq("consultation_request_id", request.id);
    assert.ok(shares?.every((s) => s.revoked_at));
    console.log("PASS share revocation on close");

    // Reassignment access: admin creates second request for B
    const { data: req2, error: req2Err } = await admin
      .from("consultation_requests")
      .insert({
        user_id: ca.id,
        request_type: "portfolio_review",
        message: `reassign-${runId}`,
        consent_given_at: new Date().toISOString(),
        privacy_version: "collab-final-1.0",
        status: "assigned",
        assigned_broker_id: brokerBId,
        broker_acceptance: "pending",
      })
      .select("id")
      .single();
    assert.equal(req2Err, null, req2Err?.message);    assert.equal(
      (
        await brokerA.api
          .from("consultation_requests")
          .select("id")
          .eq("id", req2.id)
          .maybeSingle()
      ).data,
      null
    );
    assert.ok(
      (
        await brokerB.api
          .from("consultation_requests")
          .select("id")
          .eq("id", req2.id)
          .maybeSingle()
      ).data
    );
    console.log("PASS reassignment isolation");

    console.log(JSON.stringify({ runId, requestId: request.id, offerId: offer.id }, null, 2));
  } finally {
    if (process.env.ATLAS_CLEANUP_AFTER === "1") {
      await cleanup();
    } else {
      console.log("SKIP cleanup (set ATLAS_CLEANUP_AFTER=1)");
    }
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    if (process.env.ATLAS_CLEANUP_AFTER === "1") await cleanup();
  } catch {}
  process.exit(1);
});
