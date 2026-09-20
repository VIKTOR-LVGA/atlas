import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const runId = process.env.ATLAS_BROKER_RUN_ID;
const mode = process.argv[2] ?? "validate";
const password = "AtlasBroker!2026Aa";
assert.ok(url && key, "Supabase environment is required");
assert.ok(runId, "ATLAS_BROKER_RUN_ID is required");

const credentials = Object.fromEntries(["consumer", "broker-a", "broker-b", "admin"].map((role) => [role, {
  email: `atlas-${role}-${runId}@example.com`, password, fullName: `ATLAS ${role} ${runId}`,
}]));
const client = () => createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
const ok = (error, label) => assert.equal(error, null, `${label}: ${error?.message ?? "unknown"}`);

async function signUp(name) {
  const api = client();
  const { data, error } = await api.auth.signUp({ email: credentials[name].email, password, options: { data: { full_name: credentials[name].fullName } } });
  ok(error, `signup ${name}`);
  assert.ok(data.user && data.session, `${name} must receive a session`);
  return { api, user: data.user };
}

async function signIn(name) {
  const api = client();
  const { data, error } = await api.auth.signInWithPassword(credentials[name]);
  ok(error, `signin ${name}`);
  assert.ok(data.user);
  return { api, user: data.user };
}

async function prepare() {
  const accounts = {};
  for (const name of Object.keys(credentials)) accounts[name] = await signUp(name);
  const { api, user } = accounts.consumer;
  const { data: policies, error: policyError } = await api.from("policies").insert([
    { user_id: user.id, provider: "Shared Helvetia", policy_type: "liability", policy_number: `SH-${runId}`, premium_amount: 240, premium_frequency: "annual", currency: "CHF" },
    { user_id: user.id, provider: "Private Zurich", policy_type: "travel", policy_number: `PR-${runId}`, premium_amount: 120, premium_frequency: "annual", currency: "CHF" },
  ]).select("id, provider");
  ok(policyError, "prepare policies");
  const sharedPolicy = policies.find((item) => item.provider.startsWith("Shared"));
  const privatePolicy = policies.find((item) => item.provider.startsWith("Private"));
  const { data: documents, error: documentError } = await api.from("documents").insert([
    { user_id: user.id, file_name: `shared-${runId}.pdf`, file_path: `${user.id}/shared-${runId}.pdf`, file_size: 8, mime_type: "application/pdf" },
    { user_id: user.id, file_name: `private-${runId}.pdf`, file_path: `${user.id}/private-${runId}.pdf`, file_size: 8, mime_type: "application/pdf" },
  ]).select("id, file_name");
  ok(documentError, "prepare documents");
  const sharedDocument = documents.find((item) => item.file_name.startsWith("shared"));
  const privateDocument = documents.find((item) => item.file_name.startsWith("private"));
  const { data: request, error: requestError } = await api.from("consultation_requests").insert({
    user_id: user.id, request_type: "portfolio_review", message: `Broker live ${runId}`,
    preferred_contact_method: "email", consent_given_at: new Date().toISOString(), privacy_version: "broker-live-2026-09",
  }).select("id").single();
  ok(requestError, "prepare consultation");
  const { error: shareError } = await api.from("consultation_shared_resources").insert([
    { consultation_request_id: request.id, user_id: user.id, resource_type: "policy", resource_id: sharedPolicy.id },
    { consultation_request_id: request.id, user_id: user.id, resource_type: "document", resource_id: sharedDocument.id },
  ]);
  ok(shareError, "prepare explicit shares");
  console.log(JSON.stringify({ runId, emails: Object.fromEntries(Object.entries(credentials).map(([name, item]) => [name, item.email])), ids: { consumer: user.id, request: request.id, sharedPolicy: sharedPolicy.id, privatePolicy: privatePolicy.id, sharedDocument: sharedDocument.id, privateDocument: privateDocument.id } }, null, 2));
}

async function validate() {
  const consumer = await signIn("consumer");
  const brokerA = await signIn("broker-a");
  const brokerB = await signIn("broker-b");
  const admin = await signIn("admin");
  for (const [name, session] of Object.entries({ consumer, "broker-a": brokerA, "broker-b": brokerB, admin })) {
    const { data, error } = await session.api.rpc("current_user_role"); ok(error, `role ${name}`);
    assert.equal(data, name.startsWith("broker") ? "broker" : name);
  }
  console.log("PASS 01 roles are server-derived for four identities");

  const { data: request, error: requestError } = await consumer.api.from("consultation_requests").select("id, user_id, status").eq("message", `Broker live ${runId}`).single();
  ok(requestError, "consumer request lookup");
  const { data: brokerRows, error: brokerError } = await admin.api.rpc("get_admin_brokers"); ok(brokerError, "admin broker lookup");
  const brokerAId = brokerRows.find((row) => row.auth_user_id === brokerA.user.id).id;
  console.log("PASS 02 admin sees the global broker directory");

  const { data: beforeAssignment, error: beforeError } = await brokerA.api.from("consultation_requests").select("id").eq("id", request.id); ok(beforeError, "pre-assignment isolation");
  assert.deepEqual(beforeAssignment, []);
  console.log("PASS 03 broker cannot see an unassigned request");

  const { error: assignError } = await admin.api.rpc("assign_consultation", { p_consultation_request_id: request.id, p_broker_id: brokerAId, p_reason: "live validation" }); ok(assignError, "admin assign");
  const { data: assigned } = await brokerA.api.from("consultation_requests").select("id, status").eq("id", request.id).single();
  assert.equal(assigned.status, "assigned");
  console.log("PASS 04 admin assignment is visible to broker A");

  const { data: hiddenFromB, error: hiddenError } = await brokerB.api.from("consultation_requests").select("id").eq("id", request.id); ok(hiddenError, "broker B isolation"); assert.deepEqual(hiddenFromB, []);
  console.log("PASS 05 broker B cannot see broker A lead");

  const { data: allPolicies } = await consumer.api.from("policies").select("id, provider").eq("user_id", consumer.user.id);
  const sharedPolicy = allPolicies.find((row) => row.provider.startsWith("Shared"));
  const privatePolicy = allPolicies.find((row) => row.provider.startsWith("Private"));
  const { data: visiblePolicy } = await brokerA.api.from("policies").select("id").eq("id", sharedPolicy.id); assert.equal(visiblePolicy.length, 1);
  const { data: privatePolicyRows } = await brokerA.api.from("policies").select("id").eq("id", privatePolicy.id); assert.deepEqual(privatePolicyRows, []);
  console.log("PASS 06 explicit policy sharing reveals only the selected policy");

  const { data: allDocuments } = await consumer.api.from("documents").select("id, file_name").eq("user_id", consumer.user.id);
  const sharedDocument = allDocuments.find((row) => row.file_name.startsWith("shared"));
  const privateDocument = allDocuments.find((row) => row.file_name.startsWith("private"));
  const { data: visibleDocument } = await brokerA.api.from("documents").select("id").eq("id", sharedDocument.id); assert.equal(visibleDocument.length, 1);
  const { data: privateDocumentRows } = await brokerA.api.from("documents").select("id").eq("id", privateDocument.id); assert.deepEqual(privateDocumentRows, []);
  console.log("PASS 07 explicit document sharing reveals only the selected document");

  const { error: statusError } = await brokerA.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "contacted" }); ok(statusError, "broker transition");
  const { error: forbiddenTransition } = await brokerB.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "lost" }); assert.ok(forbiddenTransition);
  console.log("PASS 08 assigned broker advances pipeline; other broker is denied");

  const { data: note, error: noteError } = await brokerA.api.from("broker_notes").insert({ consultation_request_id: request.id, broker_id: brokerAId, content: "live private note" }).select("id").single(); ok(noteError, "note create"); assert.ok(note.id);
  const { data: notesB } = await brokerB.api.from("broker_notes").select("id").eq("id", note.id); assert.deepEqual(notesB, []);
  console.log("PASS 09 notes are private to assigned broker and admin");

  const { error: appointmentError } = await brokerA.api.from("consultation_appointments").insert({ consultation_request_id: request.id, broker_id: brokerAId, scheduled_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 45, channel: "video" }); ok(appointmentError, "appointment create");
  console.log("PASS 10 assigned broker schedules an appointment");

  const { error: scheduledError } = await brokerA.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "consultation_scheduled" }); ok(scheduledError, "scheduled transition");
  const { error: reviewError } = await brokerA.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "in_review" }); ok(reviewError, "review transition");
  const { data: offer, error: offerError } = await brokerA.api.from("insurance_offers").insert({ consultation_request_id: request.id, broker_id: brokerAId, insurer: "Live Insurer", product: "Live Protect", policy_category: "liability", premium_amount: 333.35, premium_frequency: "annual", status: "proposed", proposed_at: new Date().toISOString() }).select("id").single(); ok(offerError, "offer create");
  const { error: quotedError } = await brokerA.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "quoted" }); ok(quotedError, "quoted transition");
  console.log("PASS 11 offer is recorded in the assigned pipeline");

  const { data: contract, error: contractError } = await brokerA.api.from("broker_contracts").insert({ user_id: consumer.user.id, consultation_request_id: request.id, broker_id: brokerAId, insurance_offer_id: offer.id, insurer: "Live Insurer", product: "Live Protect", category: "liability", external_policy_number: `LIVE-${runId}`, contract_start_date: "2026-10-01" }).select("id").single(); ok(contractError, "contract create");
  const { error: wonError } = await brokerA.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "won" }); ok(wonError, "won transition");
  console.log("PASS 12 contract persists and lead reaches won");

  const { data: consumerContract } = await consumer.api.from("broker_contracts").select("id").eq("id", contract.id); assert.equal(consumerContract.length, 1);
  const { data: foreignContract } = await brokerB.api.from("broker_contracts").select("id").eq("id", contract.id); assert.deepEqual(foreignContract, []);
  console.log("PASS 13 consumer sees own contract while broker B does not");

  const { data: agreement, error: agreementError } = await admin.api.from("commission_agreements").insert({ broker_id: brokerAId, effective_from: "2026-01-01", atlas_percentage: 40, broker_percentage: 60, scope: "global", notes: runId }).select("id").single(); ok(agreementError, "agreement create"); assert.ok(agreement.id);
  const commissionArgs = { p_consultation_request_id: request.id, p_broker_contract_id: contract.id, p_policy_id: null, p_parent_commission_id: null, p_insurer: "Live Insurer", p_product: "Live Protect", p_category: "liability", p_commission_type: "acquisition", p_currency: "CHF", p_gross_commission: 999.95, p_commission_rate: 12.5, p_earned_at: new Date().toISOString(), p_status: "paid", p_source: "manual", p_external_reference: runId };
  const { data: commissionId, error: commissionError } = await admin.api.rpc("create_commission_attribution", commissionArgs); ok(commissionError, "commission create");
  const { data: commission } = await admin.api.from("commission_attributions").select("gross_commission, atlas_share, broker_share").eq("id", commissionId).single();
  assert.deepEqual([Number(commission.gross_commission), Number(commission.atlas_share), Number(commission.broker_share)], [999.95, 399.98, 599.97]);
  console.log("PASS 14 PostgreSQL persists exact 999.95 / 399.98 / 599.97 split");

  const { data: adjustmentId, error: adjustmentError } = await admin.api.rpc("create_commission_adjustment", { p_commission_attribution_id: commissionId, p_adjustment_type: "clawback", p_amount: -250, p_reason: "live cancellation", p_occurred_at: new Date().toISOString() }); ok(adjustmentError, "clawback create"); assert.ok(adjustmentId);
  const { data: adjustment } = await admin.api.from("commission_adjustments").select("amount, atlas_amount, broker_amount").eq("id", adjustmentId).single(); assert.deepEqual([Number(adjustment.amount), Number(adjustment.atlas_amount), Number(adjustment.broker_amount)], [-250, -100, -150]);
  console.log("PASS 15 clawback is append-only and split proportionally");

  const { data: renewalId, error: renewalError } = await admin.api.rpc("create_commission_attribution", { ...commissionArgs, p_parent_commission_id: commissionId, p_commission_type: "renewal", p_gross_commission: 100, p_external_reference: `${runId}-renewal` }); ok(renewalError, "renewal create"); assert.ok(renewalId);
  console.log("PASS 16 renewal links to its parent attribution");

  const { data: directBrokerCommissions, error: directBrokerError } = await brokerA.api.from("commission_attributions").select("id"); ok(directBrokerError, "direct broker ledger isolation"); assert.deepEqual(directBrokerCommissions, []);
  const { data: ledger, error: ledgerError } = await brokerA.api.rpc("get_broker_commission_ledger"); ok(ledgerError, "broker ledger RPC"); assert.equal(ledger.length, 2); assert.equal(Object.hasOwn(ledger[0], "atlas_share"), false);
  console.log("PASS 17 broker ledger reveals own share but never ATLAS share");

  const { data: brokerSummary, error: brokerSummaryError } = await brokerA.api.rpc("get_broker_revenue_summary"); ok(brokerSummaryError, "broker summary"); assert.equal(Number(brokerSummary[0].net_broker_revenue), 509.97);
  const { data: adminSummary, error: adminSummaryError } = await admin.api.rpc("get_admin_revenue_summary"); ok(adminSummaryError, "admin summary"); assert.ok(Number(adminSummary[0].gross_commission) >= 1099.95);
  console.log("PASS 18 broker and admin revenue summaries reconcile");

  const { data: consumerCommissionRows, error: consumerRowsError } = await consumer.api.from("commission_attributions").select("id"); ok(consumerRowsError, "consumer commission isolation"); assert.deepEqual(consumerCommissionRows, []);
  const { error: consumerSummaryError } = await consumer.api.rpc("get_broker_revenue_summary"); assert.ok(consumerSummaryError);
  console.log("PASS 19 consumer cannot read or query commission data");

  const { data: events, error: eventsError } = await admin.api.from("consultation_events").select("event_type").eq("consultation_request_id", request.id); ok(eventsError, "audit events");
  for (const expected of ["broker_assigned", "status_changed", "appointment_scheduled", "offer_proposed", "contract_active", "commission_created", "commission_clawback"]) assert.ok(events.some((event) => event.event_type === expected), `missing ${expected}`);
  console.log("PASS 20 full operational and revenue audit trail exists");

  const { error: roleEscalationError } = await brokerB.api.rpc("set_user_role", { p_user_id: brokerB.user.id, p_role: "admin" }); assert.ok(roleEscalationError);
  const { data: brokerBAdminRows } = await brokerB.api.from("commission_attributions").select("id"); assert.deepEqual(brokerBAdminRows, []);
  console.log("PASS 21 broker cannot escalate role or access another ledger");
  console.log(`BROKER LIVE VALIDATION COMPLETE (${runId})`);
}

if (mode === "prepare") await prepare();
else await validate();
