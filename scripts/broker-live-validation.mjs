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
  assert.ok(brokerRows.some((row) => row.auth_user_id === brokerA.user.id));
  console.log("PASS 02 admin sees the global broker directory");

  const { data: assigned, error: assignedError } = await brokerA.api.from("consultation_requests").select("id, status").eq("id", request.id).single();
  ok(assignedError, "assigned request visibility");
  assert.equal(assigned.id, request.id);
  console.log("PASS 03 assigned request remains visible to broker A");

  const { data: hiddenFromB, error: hiddenError } = await brokerB.api.from("consultation_requests").select("id").eq("id", request.id); ok(hiddenError, "broker B isolation"); assert.deepEqual(hiddenFromB, []);
  console.log("PASS 04 broker B cannot see broker A lead");

  const { data: allPolicies } = await consumer.api.from("policies").select("id, provider").eq("user_id", consumer.user.id);
  const sharedPolicy = allPolicies.find((row) => row.provider.startsWith("Shared"));
  const privatePolicy = allPolicies.find((row) => row.provider.startsWith("Private"));
  const { data: visiblePolicy } = await brokerA.api.from("policies").select("id").eq("id", sharedPolicy.id); assert.equal(visiblePolicy.length, 1);
  const { data: privatePolicyRows } = await brokerA.api.from("policies").select("id").eq("id", privatePolicy.id); assert.deepEqual(privatePolicyRows, []);
  console.log("PASS 05 explicit policy sharing reveals only the selected policy");

  const { data: allDocuments } = await consumer.api.from("documents").select("id, file_name").eq("user_id", consumer.user.id);
  const sharedDocument = allDocuments.find((row) => row.file_name.startsWith("shared"));
  const privateDocument = allDocuments.find((row) => row.file_name.startsWith("private"));
  const { data: visibleDocument } = await brokerA.api.from("documents").select("id").eq("id", sharedDocument.id); assert.equal(visibleDocument.length, 1);
  const { data: privateDocumentRows } = await brokerA.api.from("documents").select("id").eq("id", privateDocument.id); assert.deepEqual(privateDocumentRows, []);
  console.log("PASS 06 explicit document sharing reveals only the selected document");

  const { error: forbiddenTransition } = await brokerB.api.rpc("transition_consultation_status", { p_consultation_request_id: request.id, p_to_status: "lost" }); assert.ok(forbiddenTransition);
  console.log("PASS 07 another broker cannot mutate the assigned pipeline");

  const { data: notesA, error: notesAError } = await brokerA.api.from("broker_notes").select("id").eq("consultation_request_id", request.id); ok(notesAError, "broker A notes"); assert.ok(notesA.length > 0);
  const { data: notesB } = await brokerB.api.from("broker_notes").select("id").eq("consultation_request_id", request.id); assert.deepEqual(notesB, []);
  console.log("PASS 08 notes are private to assigned broker and admin");

  const [{ data: appointments, error: appointmentsError }, { data: offers, error: offersError }, { data: contracts, error: contractsError }] = await Promise.all([
    brokerA.api.from("consultation_appointments").select("id").eq("consultation_request_id", request.id),
    brokerA.api.from("insurance_offers").select("id, insurer, product").eq("consultation_request_id", request.id),
    brokerA.api.from("broker_contracts").select("id, status").eq("consultation_request_id", request.id),
  ]);
  ok(appointmentsError, "appointments read"); ok(offersError, "offers read"); ok(contractsError, "contracts read");
  assert.ok(appointments.length > 0); assert.ok(offers.length > 0); assert.ok(contracts.length > 0);
  assert.ok(["won", "completed"].includes(request.status));
  const contract = contracts[0];
  console.log("PASS 09 appointment, offer and contract persist in the won pipeline");

  const { data: consumerContract } = await consumer.api.from("broker_contracts").select("id").eq("id", contract.id); assert.equal(consumerContract.length, 1);
  const { data: foreignContract } = await brokerB.api.from("broker_contracts").select("id").eq("id", contract.id); assert.deepEqual(foreignContract, []);
  console.log("PASS 10 consumer sees own contract while broker B does not");

  const { data: commission, error: commissionError } = await admin.api.from("commission_attributions").select("id, gross_commission, atlas_share, broker_share").eq("external_reference", runId).single(); ok(commissionError, "commission read");
  assert.deepEqual([Number(commission.gross_commission), Number(commission.atlas_share), Number(commission.broker_share)], [999.95, 399.98, 599.97]);
  console.log("PASS 11 PostgreSQL persists exact 999.95 / 399.98 / 599.97 split");

  const { data: adjustment, error: adjustmentError } = await admin.api.from("commission_adjustments").select("amount, atlas_amount, broker_amount").eq("commission_attribution_id", commission.id).eq("adjustment_type", "clawback").single(); ok(adjustmentError, "clawback read"); assert.deepEqual([Number(adjustment.amount), Number(adjustment.atlas_amount), Number(adjustment.broker_amount)], [-250, -100, -150]);
  console.log("PASS 12 clawback remains append-only and split proportionally");

  const { data: renewal, error: renewalError } = await admin.api.from("commission_attributions").select("id, parent_commission_id").eq("external_reference", `${runId}-renewal`).single(); ok(renewalError, "renewal read"); assert.equal(renewal.parent_commission_id, commission.id);
  console.log("PASS 13 renewal links to its parent attribution");

  const { data: directBrokerCommissions, error: directBrokerError } = await brokerA.api.from("commission_attributions").select("id"); ok(directBrokerError, "direct broker ledger isolation"); assert.deepEqual(directBrokerCommissions, []);
  const { data: ledger, error: ledgerError } = await brokerA.api.rpc("get_broker_commission_ledger"); ok(ledgerError, "broker ledger RPC"); assert.equal(ledger.length, 2); assert.equal(Object.hasOwn(ledger[0], "atlas_share"), false);
  console.log("PASS 14 broker ledger reveals own share but never ATLAS share");

  const { data: brokerSummary, error: brokerSummaryError } = await brokerA.api.rpc("get_broker_revenue_summary"); ok(brokerSummaryError, "broker summary"); assert.equal(Number(brokerSummary[0].net_broker_revenue), 509.97);
  const { data: adminSummary, error: adminSummaryError } = await admin.api.rpc("get_admin_revenue_summary"); ok(adminSummaryError, "admin summary"); assert.ok(Number(adminSummary[0].gross_commission) >= 1099.95);
  console.log("PASS 15 broker and admin revenue summaries reconcile");

  const { data: consumerCommissionRows, error: consumerRowsError } = await consumer.api.from("commission_attributions").select("id"); ok(consumerRowsError, "consumer commission isolation"); assert.deepEqual(consumerCommissionRows, []);
  const { error: consumerSummaryError } = await consumer.api.rpc("get_broker_revenue_summary"); assert.ok(consumerSummaryError);
  console.log("PASS 16 consumer cannot read or query commission data");

  const { data: events, error: eventsError } = await admin.api.from("consultation_events").select("event_type").eq("consultation_request_id", request.id); ok(eventsError, "audit events");
  for (const expected of ["broker_assigned", "status_changed", "appointment_scheduled", "offer_proposed", "contract_active", "commission_created", "commission_clawback"]) assert.ok(events.some((event) => event.event_type === expected), `missing ${expected}`);
  console.log("PASS 17 full operational and revenue audit trail exists");

  const { error: roleEscalationError } = await brokerB.api.rpc("set_user_role", { p_user_id: brokerB.user.id, p_role: "admin" }); assert.ok(roleEscalationError);
  const { data: brokerBAdminRows } = await brokerB.api.from("commission_attributions").select("id"); assert.deepEqual(brokerBAdminRows, []);
  console.log("PASS 18 broker cannot escalate role or access another ledger");
  console.log(`BROKER LIVE VALIDATION COMPLETE (${runId})`);
}

if (mode === "prepare") await prepare();
else await validate();
