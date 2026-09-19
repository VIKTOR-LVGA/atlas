import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL is required");
assert.ok(
  publishableKey,
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"
);

const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = `Atlas!${randomUUID()}Aa1`;
const users = ["a", "b"].map((label) => ({
  email: `atlas-e2e-${label}-${runId}@example.com`,
  password,
  fullName: `Atlas E2E ${label.toUpperCase()}`,
}));

function makeClient() {
  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function checkNoError(error, context) {
  assert.equal(error, null, `${context}: ${error?.message ?? "unknown error"}`);
}

async function createUser(client, credentials) {
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: { data: { full_name: credentials.fullName } },
  });

  checkNoError(error, `signup ${credentials.email}`);
  assert.ok(data.user, "signup must return a user");
  assert.ok(data.session, "email signup must return a live session");
  return data.user;
}

async function assertCrossUserCrudIsolation(client, table, id) {
  const { data: selected, error: selectError } = await client
    .from(table)
    .select("id")
    .eq("id", id);
  checkNoError(selectError, `${table} cross-user select`);
  assert.deepEqual(selected, [], `${table} must hide another user's row`);

  const { data: updated, error: updateError } = await client
    .from(table)
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  checkNoError(updateError, `${table} cross-user update`);
  assert.deepEqual(updated, [], `${table} must block another user's update`);

  const { data: deleted, error: deleteError } = await client
    .from(table)
    .delete()
    .eq("id", id)
    .select("id");
  checkNoError(deleteError, `${table} cross-user delete`);
  assert.deepEqual(deleted, [], `${table} must block another user's delete`);
}

async function main() {
  const clientA = makeClient();
  const clientB = makeClient();
  let policyId = null;
  let documentId = null;
  let filePath = null;
  let familyMemberId = null;
  let propertyId = null;
  let vehicleId = null;
  let coverageId = null;
  let opportunityId = null;
  let consultationId = null;

  const userA = await createUser(clientA, users[0]);
  const userB = await createUser(clientB, users[1]);
  console.log("PASS register and live sessions (2 users)");

  const { data: profileA, error: profileReadError } = await clientA
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", userA.id)
    .single();
  checkNoError(profileReadError, "profile trigger read");
  assert.equal(profileA.full_name, users[0].fullName);

  const updatedName = `${users[0].fullName} Updated`;
  const { data: updatedProfile, error: profileUpdateError } = await clientA
    .from("profiles")
    .update({ full_name: updatedName, language: "it", currency: "CHF" })
    .eq("id", userA.id)
    .select("full_name")
    .single();
  checkNoError(profileUpdateError, "profile update");
  assert.equal(updatedProfile.full_name, updatedName);
  console.log("PASS profile trigger, read, update, persistence");

  const { data: createdPolicy, error: policyCreateError } = await clientA
    .from("policies")
    .insert({
      user_id: userA.id,
      provider: "ATLAS E2E Assicurazioni",
      policy_type: "liability",
      premium_amount: 120,
      premium_frequency: "annual",
      currency: "CHF",
      notes: runId,
    })
    .select("id, provider, premium_amount")
    .single();
  checkNoError(policyCreateError, "policy create");
  policyId = createdPolicy.id;
  assert.equal(createdPolicy.provider, "ATLAS E2E Assicurazioni");

  const { data: updatedPolicy, error: policyUpdateError } = await clientA
    .from("policies")
    .update({ premium_amount: 144 })
    .eq("id", policyId)
    .select("id, premium_amount")
    .single();
  checkNoError(policyUpdateError, "policy update");
  assert.equal(Number(updatedPolicy.premium_amount), 144);
  console.log("PASS policies create, read, update");

  const pdfBytes = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
  );
  filePath = `${userA.id}/${randomUUID()}-atlas-e2e.pdf`;
  const { error: storageUploadError } = await clientA.storage
    .from("policy-documents")
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  checkNoError(storageUploadError, "storage upload");

  const { data: createdDocument, error: documentCreateError } = await clientA
    .from("documents")
    .insert({
      user_id: userA.id,
      file_name: "atlas-e2e.pdf",
      file_path: filePath,
      file_size: pdfBytes.length,
      mime_type: "application/pdf",
    })
    .select("id, file_path")
    .single();
  checkNoError(documentCreateError, "document metadata create");
  documentId = createdDocument.id;

  const { data: familyMember, error: familyError } = await clientA
    .from("family_members")
    .insert({
      user_id: userA.id,
      first_name: "Giulia",
      last_name: "Atlas",
      relationship: "partner",
      is_policy_holder: true,
    })
    .select("id, first_name")
    .single();
  checkNoError(familyError, "family member create");
  familyMemberId = familyMember.id;

  const { data: property, error: propertyError } = await clientA
    .from("properties")
    .insert({
      user_id: userA.id,
      label: "Casa E2E",
      property_type: "apartment",
      occupancy_type: "tenant",
      postal_code: "6900",
      city: "Lugano",
    })
    .select("id, label")
    .single();
  checkNoError(propertyError, "property create");
  propertyId = property.id;

  const { data: vehicle, error: vehicleError } = await clientA
    .from("vehicles")
    .insert({
      user_id: userA.id,
      label: "Auto E2E",
      vehicle_type: "car",
      make: "Volvo",
      license_plate: "TI 123456",
    })
    .select("id, label")
    .single();
  checkNoError(vehicleError, "vehicle create");
  vehicleId = vehicle.id;

  const { error: policyRelationError } = await clientA
    .from("policies")
    .update({
      family_member_id: familyMemberId,
      property_id: propertyId,
      vehicle_id: vehicleId,
    })
    .eq("id", policyId);
  checkNoError(policyRelationError, "policy household relations");

  const { error: policyMemberError } = await clientA.from("policy_members").insert({
    user_id: userA.id,
    policy_id: policyId,
    family_member_id: familyMemberId,
    role: "insured_person",
  });
  checkNoError(policyMemberError, "policy member create");

  const { data: coverage, error: coverageError } = await clientA
    .from("policy_coverages")
    .insert({
      user_id: userA.id,
      policy_id: policyId,
      canonical_type: "private_liability",
      original_label: "Responsabilità civile privata",
      insurance_category: "private_liability",
      coverage_status: "included",
      coverage_limit: 10000000,
      currency: "CHF",
      source: "manual",
      provenance: "explicit",
      confidence: 100,
      source_document_id: documentId,
      family_member_id: familyMemberId,
      property_id: propertyId,
      vehicle_id: vehicleId,
    })
    .select("id, canonical_type")
    .single();
  checkNoError(coverageError, "policy coverage create");
  coverageId = coverage.id;

  const { data: opportunity, error: opportunityError } = await clientA
    .from("opportunities")
    .insert({
      user_id: userA.id,
      policy_id: policyId,
      opportunity_type: "periodic_review",
      title: "Revisione E2E",
      description: "Verifica periodica portafoglio",
      source_key: `e2e:${runId}`,
    })
    .select("id, status")
    .single();
  checkNoError(opportunityError, "opportunity create");
  opportunityId = opportunity.id;

  const { data: consultation, error: consultationError } = await clientA
    .from("consultation_requests")
    .insert({
      user_id: userA.id,
      request_type: "portfolio_review",
      message: "Richiesta E2E",
      preferred_contact_method: "email",
      consent_given_at: new Date().toISOString(),
      privacy_version: "2026-09",
      source_opportunity_id: opportunityId,
    })
    .select("id, status, assigned_broker_id")
    .single();
  checkNoError(consultationError, "consultation request create");
  consultationId = consultation.id;
  assert.equal(consultation.status, "submitted");
  assert.equal(consultation.assigned_broker_id, null);

  const { data: events, error: eventsError } = await clientA
    .from("consultation_events")
    .select("event_type")
    .eq("consultation_request_id", consultationId);
  checkNoError(eventsError, "consultation submission audit event");
  assert.deepEqual(events.map((event) => event.event_type), ["request_submitted"]);
  console.log("PASS household, canonical coverage, opportunity, consultation persistence");

  const { data: signed, error: signedError } = await clientA.storage
    .from("policy-documents")
    .createSignedUrl(filePath, 60, { download: "atlas-e2e.pdf" });
  checkNoError(signedError, "owner signed URL");
  assert.ok(signed?.signedUrl, "owner signed URL must exist");
  const downloadResponse = await fetch(signed.signedUrl);
  assert.equal(downloadResponse.ok, true, "signed URL download must succeed");
  assert.ok((await downloadResponse.arrayBuffer()).byteLength > 0);
  console.log("PASS documents upload, metadata, signed URL, download");

  const { data: crossPolicies, error: crossPolicyReadError } = await clientB
    .from("policies")
    .select("id")
    .eq("id", policyId);
  checkNoError(crossPolicyReadError, "cross-user policy select");
  assert.deepEqual(crossPolicies, []);

  const { data: crossPolicyUpdate, error: crossPolicyUpdateError } = await clientB
    .from("policies")
    .update({ provider: "forbidden" })
    .eq("id", policyId)
    .select("id");
  checkNoError(crossPolicyUpdateError, "cross-user policy update");
  assert.deepEqual(crossPolicyUpdate, []);

  const { data: crossPolicyDelete, error: crossPolicyDeleteError } = await clientB
    .from("policies")
    .delete()
    .eq("id", policyId)
    .select("id");
  checkNoError(crossPolicyDeleteError, "cross-user policy delete");
  assert.deepEqual(crossPolicyDelete, []);

  const { data: crossDocuments, error: crossDocumentReadError } = await clientB
    .from("documents")
    .select("id")
    .eq("id", documentId);
  checkNoError(crossDocumentReadError, "cross-user document select");
  assert.deepEqual(crossDocuments, []);

  const { data: crossSigned, error: crossSignedError } = await clientB.storage
    .from("policy-documents")
    .createSignedUrl(filePath, 60);
  assert.equal(crossSigned, null);
  assert.ok(crossSignedError, "cross-user signed URL must be denied");

  const { data: crossDownload, error: crossDownloadError } = await clientB.storage
    .from("policy-documents")
    .download(filePath);
  assert.equal(crossDownload, null);
  assert.ok(crossDownloadError, "cross-user storage download must be denied");

  for (const [table, id] of [
    ["family_members", familyMemberId],
    ["properties", propertyId],
    ["vehicles", vehicleId],
    ["policy_coverages", coverageId],
    ["opportunities", opportunityId],
  ]) {
    await assertCrossUserCrudIsolation(clientB, table, id);
  }

  const { data: crossPolicyMembers, error: crossPolicyMembersError } = await clientB
    .from("policy_members")
    .select("policy_id")
    .eq("policy_id", policyId);
  checkNoError(crossPolicyMembersError, "policy_members cross-user select");
  assert.deepEqual(crossPolicyMembers, []);

  const { data: crossPolicyMemberUpdate, error: crossPolicyMemberUpdateError } = await clientB
    .from("policy_members")
    .update({ role: "beneficiary" })
    .eq("policy_id", policyId)
    .eq("family_member_id", familyMemberId)
    .select("policy_id");
  checkNoError(crossPolicyMemberUpdateError, "policy_members cross-user update");
  assert.deepEqual(crossPolicyMemberUpdate, []);

  const { data: crossPolicyMemberDelete, error: crossPolicyMemberDeleteError } = await clientB
    .from("policy_members")
    .delete()
    .eq("policy_id", policyId)
    .eq("family_member_id", familyMemberId)
    .select("policy_id");
  checkNoError(crossPolicyMemberDeleteError, "policy_members cross-user delete");
  assert.deepEqual(crossPolicyMemberDelete, []);

  const { data: crossConsultation, error: crossConsultationError } = await clientB
    .from("consultation_requests")
    .select("id")
    .eq("id", consultationId);
  checkNoError(crossConsultationError, "consultation cross-user select");
  assert.deepEqual(crossConsultation, []);

  const { error: crossConsultationUpdateError } = await clientB
    .from("consultation_requests")
    .update({ message: "forbidden" })
    .eq("id", consultationId);
  assert.ok(crossConsultationUpdateError, "consultation update must be denied to consumers");

  const { error: crossConsultationDeleteError } = await clientB
    .from("consultation_requests")
    .delete()
    .eq("id", consultationId);
  assert.ok(crossConsultationDeleteError, "consultation delete must be denied to consumers");

  const { data: crossEvents, error: crossEventsError } = await clientB
    .from("consultation_events")
    .select("id")
    .eq("consultation_request_id", consultationId);
  checkNoError(crossEventsError, "consultation events cross-user select");
  assert.deepEqual(crossEvents, []);

  const { error: foreignOpportunityError } = await clientB
    .from("opportunities")
    .insert({
      user_id: userB.id,
      policy_id: policyId,
      opportunity_type: "periodic_review",
      title: "Forbidden",
      description: "Must fail",
    });
  assert.ok(foreignOpportunityError, "foreign policy opportunity insert must fail");

  const { error: brokerReadError } = await clientA.from("brokers").select("id");
  assert.ok(brokerReadError, "consumer must not read broker directory directly");
  console.log("PASS all new-table USER_A -> USER_B RLS isolation and broker boundary");

  await clientB.storage.from("policy-documents").remove([filePath]);
  const { data: ownerStillReads, error: ownerStillReadsError } =
    await clientA.storage.from("policy-documents").download(filePath);
  checkNoError(ownerStillReadsError, "owner file after cross-user delete attempt");
  assert.ok(ownerStillReads, "cross-user delete must not remove owner file");
  console.log("PASS database and storage USER_A -> USER_B isolation");

  const { error: invalidLoginError } = await makeClient().auth.signInWithPassword({
    email: users[0].email,
    password: "DefinitelyWrong123!",
  });
  assert.ok(invalidLoginError, "invalid password must be rejected");
  checkNoError((await clientA.auth.signOut()).error, "logout");
  assert.equal((await clientA.auth.getSession()).data.session, null);
  const { data: relogin, error: reloginError } =
    await clientA.auth.signInWithPassword(users[0]);
  checkNoError(reloginError, "login after logout");
  assert.equal(relogin.user?.id, userA.id);
  console.log("PASS invalid login, logout, login, session");

  const { data: deletedPolicy, error: ownerPolicyDeleteError } = await clientA
    .from("policies")
    .delete()
    .eq("id", policyId)
    .select("id")
    .single();
  checkNoError(ownerPolicyDeleteError, "owner policy delete");
  assert.equal(deletedPolicy.id, policyId);
  policyId = null;

  for (const [table, id] of [
    ["family_members", familyMemberId],
    ["properties", propertyId],
    ["vehicles", vehicleId],
  ]) {
    checkNoError((await clientA.from(table).delete().eq("id", id)).error, `${table} cleanup`);
  }

  checkNoError(
    (await clientA.from("documents").delete().eq("id", documentId)).error,
    "owner document metadata delete"
  );
  documentId = null;
  checkNoError(
    (await clientA.storage.from("policy-documents").remove([filePath])).error,
    "owner storage delete"
  );
  const { data: removedFile } = await clientA.storage
    .from("policy-documents")
    .download(filePath);
  assert.equal(removedFile, null);
  filePath = null;
  console.log("PASS policies delete and documents delete cleanup");

  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
  assert.notEqual(userA.id, userB.id);
  console.log("PASS ATLAS Supabase live validation complete");
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
