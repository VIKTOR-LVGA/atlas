/**
 * Live partner lifecycle validation using only publishable credentials.
 * Admin mutations still pass through database role checks.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { assertLiveFixtureSafety } from "./live-fixture-safety.mjs";

assertLiveFixtureSafety("partner-lifecycle-validation");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const runId = process.env.ATLAS_PARTNER_LIFECYCLE_RUN_ID ?? "20260920c";
const fixtureRunId = process.env.ATLAS_BROKER_E2E_RUN_ID ?? "20260920b";
const password = process.env.ATLAS_BROKER_E2E_PASSWORD ?? "AtlasBroker!2026Aa";

assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL required");
assert.ok(key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY required");

const makeClient = () =>
  createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

async function login(email) {
  const client = makeClient();
  const result = await client.auth.signInWithPassword({ email, password });
  assert.equal(result.error, null, `${email} login failed: ${result.error?.message}`);
  return { client, user: result.data.user };
}

async function loginOrCreate(kind) {
  const email = `atlas-partner-${kind}-${runId}@example.com`;
  const client = makeClient();
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (!signedIn.error && signedIn.data.user) return { client, user: signedIn.data.user, email };

  const signedUp = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: `ATLAS Partner ${kind} ${runId}` } },
  });
  assert.equal(signedUp.error, null, `${kind} signup failed: ${signedUp.error?.message}`);
  assert.ok(signedUp.data.session, `${kind} signup must return a live session`);
  return { client, user: signedUp.data.user, email };
}

async function role(client) {
  const result = await client.rpc("current_user_role");
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}

async function ensureSubmitted(account, kind) {
  const existing = await account.client
    .from("partner_applications")
    .select("id, status, broker_id")
    .eq("user_id", account.user.id)
    .maybeSingle();
  assert.equal(existing.error, null, existing.error?.message);
  if (existing.data) return existing.data;

  const inserted = await account.client
    .from("partner_applications")
    .insert({
      user_id: account.user.id,
      first_name: "Partner",
      last_name: kind === "approve" ? "Approved" : "Rejected",
      organization_name: `ATLAS Lifecycle ${kind}`,
      professional_email: account.email,
      phone: "+41910000000",
      partner_type: "independent_broker",
      primary_canton: kind === "approve" ? "TI" : "ZH",
      served_cantons: kind === "approve" ? ["TI", "GE"] : ["ZH"],
      languages: ["it", "de"],
      consent_given_at: new Date().toISOString(),
      terms_accepted_at: new Date().toISOString(),
      status: "submitted",
    })
    .select("id, status, broker_id")
    .single();
  assert.equal(inserted.error, null, inserted.error?.message);
  return inserted.data;
}

async function review(admin, applicationId, decision, notes, rejectionReason = null) {
  const result = await admin.rpc("review_partner_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_admin_notes: notes,
    p_rejection_reason: rejectionReason,
  });
  assert.equal(result.error, null, `${decision} failed: ${result.error?.message}`);
  return result.data;
}

async function main() {
  const { client: admin } = await login(`atlas-admin-${fixtureRunId}@example.com`);
  const approveAccount = await loginOrCreate("approve");
  const rejectAccount = await loginOrCreate("reject");
  assert.equal(await role(admin), "admin");
  assert.equal(await role(approveAccount.client), "consumer");
  assert.equal(await role(rejectAccount.client), "consumer");

  const approveApplication = await ensureSubmitted(approveAccount, "approve");
  const rejectApplication = await ensureSubmitted(rejectAccount, "reject");
  assert.equal(approveApplication.status, "submitted");
  assert.equal(rejectApplication.status, "submitted");
  console.log("PASS two dedicated applications submitted");

  const pendingProfile = await approveAccount.client.rpc("get_current_partner_profile");
  assert.ok(pendingProfile.error, "pending applicant must not obtain a partner profile");
  const pendingAdmin = await approveAccount.client.rpc("get_control_center_summary", {});
  assert.ok(pendingAdmin.error, "pending applicant must not obtain control-center data");
  console.log("PASS pending applicant denied partner and admin access");

  await review(admin, approveApplication.id, "under_review", "Internal approve note");
  const underReview = await approveAccount.client
    .from("partner_applications")
    .select("status")
    .eq("id", approveApplication.id)
    .single();
  assert.equal(underReview.data.status, "under_review");
  const hiddenReview = await approveAccount.client
    .from("partner_application_reviews")
    .select("*")
    .eq("application_id", approveApplication.id);
  assert.deepEqual(hiddenReview.data, []);
  console.log("PASS under-review state and internal note isolation");

  const approvedBrokerId = await review(
    admin,
    approveApplication.id,
    "approve",
    "Approved after lifecycle validation"
  );
  assert.ok(approvedBrokerId);
  assert.equal(await role(approveAccount.client), "broker");

  const approvedApplication = await admin
    .from("partner_applications")
    .select("status, broker_id")
    .eq("id", approveApplication.id)
    .single();
  assert.equal(approvedApplication.data.status, "approved");
  assert.equal(approvedApplication.data.broker_id, approvedBrokerId);

  const approvedProfile = await approveAccount.client.rpc("get_current_partner_profile");
  assert.equal(approvedProfile.error, null, approvedProfile.error?.message);
  assert.equal(approvedProfile.data[0].id, approvedBrokerId);
  assert.equal(approvedProfile.data[0].auth_user_id, approveAccount.user.id);

  const brokersBeforeRepeat = await admin.rpc("get_admin_brokers");
  const approvalEventsBefore = await admin
    .from("platform_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "partner_application_approved")
    .eq("target_id", approveApplication.id);
  const repeatedBrokerId = await review(admin, approveApplication.id, "approve", "repeat");
  const brokersAfterRepeat = await admin.rpc("get_admin_brokers");
  const approvalEventsAfter = await admin
    .from("platform_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "partner_application_approved")
    .eq("target_id", approveApplication.id);
  assert.equal(repeatedBrokerId, approvedBrokerId);
  assert.equal(brokersAfterRepeat.data.length, brokersBeforeRepeat.data.length);
  assert.equal(approvalEventsAfter.count, approvalEventsBefore.count);
  console.log("PASS approval is atomic and idempotent");

  await review(admin, approveApplication.id, "suspend", "Lifecycle suspension");
  assert.equal(await role(approveAccount.client), "consumer");
  const suspendedProfile = await approveAccount.client.rpc("get_current_partner_profile");
  assert.ok(suspendedProfile.error, "existing session retained partner access after suspension");
  const suspendedLedger = await approveAccount.client.rpc("get_broker_commission_ledger");
  assert.ok(suspendedLedger.error, "existing session retained privileged operations after suspension");
  const suspendedBroker = await admin.rpc("get_admin_brokers");
  assert.equal(
    suspendedBroker.data.find((row) => row.id === approvedBrokerId).active,
    false
  );
  console.log("PASS suspension revokes an already-open session and preserves broker history");

  await review(admin, approveApplication.id, "reactivate", "Lifecycle reactivation");
  assert.equal(await role(approveAccount.client), "broker");
  const reactivatedProfile = await approveAccount.client.rpc("get_current_partner_profile");
  assert.equal(reactivatedProfile.error, null, reactivatedProfile.error?.message);
  assert.equal(reactivatedProfile.data[0].id, approvedBrokerId);
  console.log("PASS reactivation restores the same partner identity");

  await review(admin, rejectApplication.id, "under_review", "Private rejection note");
  await review(
    admin,
    rejectApplication.id,
    "reject",
    "Internal reason not for applicant",
    "Requisiti professionali da completare"
  );
  const rejectedPublic = await rejectAccount.client
    .from("partner_applications")
    .select("status, rejection_reason")
    .eq("id", rejectApplication.id)
    .single();
  assert.equal(rejectedPublic.data.status, "rejected");
  assert.equal(rejectedPublic.data.rejection_reason, "Requisiti professionali da completare");
  const rejectedInternal = await rejectAccount.client
    .from("partner_application_reviews")
    .select("*")
    .eq("application_id", rejectApplication.id);
  assert.deepEqual(rejectedInternal.data, []);
  assert.equal(await role(rejectAccount.client), "consumer");
  console.log("PASS rejection exposes only the public reason");

  const adminReviews = await admin
    .from("partner_application_reviews")
    .select("application_id, admin_notes, reviewed_by, reviewed_at")
    .in("application_id", [approveApplication.id, rejectApplication.id]);
  assert.equal(adminReviews.error, null, adminReviews.error?.message);
  assert.equal(adminReviews.data.length, 2);
  assert.ok(adminReviews.data.every((row) => row.admin_notes && row.reviewed_by));

  const expectedEvents = [
    "partner_application_under_review",
    "partner_application_approved",
    "partner_suspended",
    "partner_reactivated",
    "partner_application_rejected",
  ];
  const audit = await admin
    .from("platform_audit_log")
    .select("event_type, target_id")
    .in("target_id", [approveApplication.id, rejectApplication.id]);
  assert.equal(audit.error, null, audit.error?.message);
  for (const eventType of expectedEvents) {
    assert.ok(audit.data.some((row) => row.event_type === eventType), `missing ${eventType}`);
  }
  console.log("PASS lifecycle audit trail and admin review visibility");

  if (process.env.ATLAS_CLEANUP_AFTER === "1" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminApi = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const account of [approveAccount, rejectAccount]) {
      await adminApi.from("partner_applications").delete().eq("user_id", account.user.id);
      await adminApi.from("brokers").delete().eq("auth_user_id", account.user.id);
      const { error } = await adminApi.auth.admin.deleteUser(account.user.id);
      assert.equal(error, null, `cleanup ${account.email}: ${error?.message}`);
    }
    console.log("PASS lifecycle fixture accounts removed");
  }

  console.log(`PARTNER LIFECYCLE VALIDATION COMPLETE (${runId})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
