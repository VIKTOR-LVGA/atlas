"use server";

import { revalidatePath } from "next/cache";
import { requireOperationsRole } from "@/lib/operations-access";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function required(formData: FormData, key: string) {
  const result = value(formData, key);
  if (!result) throw new Error(`Campo ${key} obbligatorio.`);
  return result;
}

export async function transitionLeadAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["broker"]);
  const requestId = required(formData, "request_id");
  const { error } = await supabase.rpc("transition_consultation_status", {
    p_consultation_request_id: requestId,
    p_to_status: required(formData, "status"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
  revalidatePath("/broker");
}

export async function addBrokerNoteAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const { error } = await supabase.from("broker_notes").insert({
    consultation_request_id: requestId,
    broker_id: broker.id,
    content: required(formData, "content").slice(0, 8000),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
}

export async function scheduleAppointmentAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const { error } = await supabase.from("consultation_appointments").insert({
    consultation_request_id: requestId,
    broker_id: broker.id,
    scheduled_at: new Date(required(formData, "scheduled_at")).toISOString(),
    duration_minutes: Number(value(formData, "duration_minutes") || 45),
    channel: required(formData, "channel"),
    location_or_link: value(formData, "location_or_link") || null,
    notes: value(formData, "notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
}

export async function createOfferAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const premium = value(formData, "premium_amount");
  const { error } = await supabase.from("insurance_offers").insert({
    consultation_request_id: requestId,
    broker_id: broker.id,
    insurer: required(formData, "insurer"),
    product: required(formData, "product"),
    policy_category: required(formData, "category"),
    premium_amount: premium ? Number(premium) : null,
    premium_frequency: value(formData, "premium_frequency") || null,
    status: "draft",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
}

export async function updateOfferStatusAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const status = required(formData, "status");
  if (!["proposed", "accepted", "rejected", "expired"].includes(status)) throw new Error("Stato offerta non valido.");
  const now = new Date().toISOString();
  const { error } = await supabase.from("insurance_offers").update({
    status,
    proposed_at: status === "proposed" ? now : undefined,
    accepted_at: status === "accepted" ? now : undefined,
    rejected_at: status === "rejected" ? now : undefined,
  }).eq("id", required(formData, "offer_id")).eq("broker_id", broker.id).eq("consultation_request_id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
}

export async function createContractAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const { data: request, error: requestError } = await supabase
    .from("consultation_requests")
    .select("user_id")
    .eq("id", requestId)
    .eq("assigned_broker_id", broker.id)
    .single();
  if (requestError || !request) throw new Error("Richiesta non disponibile.");
  const { error } = await supabase.from("broker_contracts").insert({
    user_id: request.user_id,
    consultation_request_id: requestId,
    broker_id: broker.id,
    insurance_offer_id: value(formData, "offer_id") || null,
    insurer: required(formData, "insurer"),
    product: required(formData, "product"),
    category: required(formData, "category"),
    external_policy_number: value(formData, "policy_number") || null,
    contract_start_date: required(formData, "start_date"),
    contract_end_date: value(formData, "end_date") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/broker/leads/${requestId}`);
  revalidatePath("/broker");
}
