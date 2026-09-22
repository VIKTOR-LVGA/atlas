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

function revalidateLead(requestId: string) {
  revalidatePath(`/broker/requests/${requestId}`);
  revalidatePath("/broker/dashboard");
  revalidatePath("/broker/requests");
  revalidatePath(`/broker/requests/${requestId}`);
  revalidatePath("/broker");
}

export async function transitionLeadAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["broker"]);
  const requestId = required(formData, "request_id");
  const { error } = await supabase.rpc("transition_consultation_status", {
    p_consultation_request_id: requestId,
    p_to_status: required(formData, "status"),
  });
  if (error) throw new Error(error.message);
  revalidateLead(requestId);
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
  revalidateLead(requestId);
}

export async function scheduleAppointmentAction(formData: FormData) {
  const { supabase, broker, user } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const scheduledAt = new Date(required(formData, "scheduled_at")).toISOString();
  const duration = Number(value(formData, "duration_minutes") || 45);
  const channel = required(formData, "channel");
  const { data: appt, error } = await supabase
    .from("consultation_appointments")
    .insert({
      consultation_request_id: requestId,
      broker_id: broker.id,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      channel,
      location_or_link: value(formData, "location_or_link") || null,
      notes: value(formData, "notes") || null,
      status: "proposed",
      proposal_status: "pending",
      proposed_by: "broker",
      proposed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (appt) {
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: requestId,
      actor_user_id: user!.id,
      actor_role: "broker",
      event_type: "proposed",
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      channel,
    });
  }

  await supabase
    .from("consultation_requests")
    .update({ status: "consultation_scheduled" })
    .eq("id", requestId)
    .eq("assigned_broker_id", broker.id);

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();
  if (request?.user_id) {
    await supabase.rpc("notify_user_activity", {
      p_user_id: request.user_id,
      p_consultation_id: requestId,
      p_event_type: "appointment_proposed",
      p_title: "Appuntamento proposto",
      p_body: null,
      p_href: `/consultations/${requestId}?tab=appointment`,
    });
  }

  revalidateLead(requestId);
  revalidatePath("/broker/appointments");
}

export async function createOfferAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const premium = value(formData, "premium_amount");
  const sourcePolicy = value(formData, "source_policy_id");
  const { error } = await supabase.from("insurance_offers").insert({
    consultation_request_id: requestId,
    broker_id: broker.id,
    insurer: required(formData, "insurer"),
    product: required(formData, "product"),
    policy_category: required(formData, "category"),
    premium_amount: premium ? Number(premium) : null,
    premium_frequency: value(formData, "premium_frequency") || "annual",
    source_policy_id: sourcePolicy || null,
    consumer_visible_notes: value(formData, "consumer_notes") || null,
    quote_validity_date: value(formData, "quote_validity_date") || null,
    effective_date: value(formData, "effective_date") || null,
    currency: value(formData, "currency") || "CHF",
    status: "draft",
  });
  if (error) throw new Error(error.message);
  revalidateLead(requestId);
  revalidatePath("/broker/offers");
}

export async function updateOfferStatusAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const status = required(formData, "status");
  if (!["proposed", "sent", "accepted", "rejected", "expired", "converted"].includes(status)) {
    throw new Error("Stato offerta non valido.");
  }
  const offerId = required(formData, "offer_id");
  const now = new Date().toISOString();
  const sendStatuses = ["proposed", "sent"];

  if (sendStatuses.includes(status)) {
    const { data: offer } = await supabase
      .from("insurance_offers")
      .select("id, extraction_status, source_policy_id, status")
      .eq("id", offerId)
      .eq("broker_id", broker.id)
      .maybeSingle();
    if (!offer) throw new Error("Offerta non trovata.");
    if (offer.status !== "draft") throw new Error("Solo le bozze possono essere inviate.");
    if (!offer.source_policy_id) {
      throw new Error("Seleziona e verifica la polizza da confrontare prima dell'invio.");
    }
    if (!["verified", "ready_to_send"].includes(String(offer.extraction_status ?? ""))) {
      throw new Error("Conferma «Dati verificati» prima di inviare l'offerta.");
    }
  }

  const mapped = status === "sent" || status === "proposed" ? "sent" : status;
  const { error } = await supabase
    .from("insurance_offers")
    .update({
      status: mapped,
      proposed_at: sendStatuses.includes(status) ? now : undefined,
      accepted_at: status === "accepted" ? now : undefined,
      rejected_at: status === "rejected" ? now : undefined,
    })
    .eq("id", offerId)
    .eq("broker_id", broker.id)
    .eq("consultation_request_id", requestId);
  if (error) throw new Error(error.message);

  if (sendStatuses.includes(status)) {
    await supabase
      .from("consultation_requests")
      .update({ status: "quoted" })
      .eq("id", requestId)
      .eq("assigned_broker_id", broker.id);
    const { data: request } = await supabase
      .from("consultation_requests")
      .select("user_id")
      .eq("id", requestId)
      .maybeSingle();
    if (request?.user_id) {
      await supabase.rpc("notify_user_activity", {
        p_user_id: request.user_id,
        p_consultation_id: requestId,
        p_event_type: "offer_sent",
        p_title: "Nuova offerta — preventivo verificato",
        p_body: null,
        p_href: `/consultations/${requestId}?tab=offers`,
      });
    }
  }

  revalidateLead(requestId);
  revalidatePath("/broker/offers");
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
  const offerId = value(formData, "offer_id") || null;
  const insurer = required(formData, "insurer");
  const product = required(formData, "product");
  const category = required(formData, "category");
  const { data: contract, error } = await supabase
    .from("broker_contracts")
    .insert({
      user_id: request.user_id,
      consultation_request_id: requestId,
      broker_id: broker.id,
      insurance_offer_id: offerId,
      insurer,
      product,
      category,
      external_policy_number: value(formData, "policy_number") || null,
      contract_start_date: required(formData, "start_date"),
      contract_end_date: value(formData, "end_date") || null,
      switch_reason_code: value(formData, "switch_reason") || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (offerId) {
    await supabase
      .from("insurance_offers")
      .update({ status: "converted" })
      .eq("id", offerId)
      .eq("broker_id", broker.id);
  }

  const fromInsurer = value(formData, "from_insurer") || null;
  const oldPremium = value(formData, "old_premium");
  const newPremium = value(formData, "new_premium");
  if (contract) {
    await supabase.from("switch_events").insert({
      consultation_request_id: requestId,
      consumer_user_id: request.user_id,
      broker_id: broker.id,
      contract_id: contract.id,
      offer_id: offerId,
      category,
      from_insurer: fromInsurer,
      to_insurer: insurer,
      old_premium: oldPremium ? Number(oldPremium) : null,
      new_premium: newPremium ? Number(newPremium) : null,
      reason_code: value(formData, "switch_reason") || null,
      source: "broker_confirmed",
    });
  }

  revalidateLead(requestId);
  revalidatePath("/broker/contracts");
  revalidatePath("/broker/commissions");
}

export async function brokerRespondAssignmentAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["broker"]);
  const requestId = required(formData, "request_id");
  const decision = required(formData, "decision");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const { error } = await supabase.rpc("broker_respond_to_assignment", {
    p_consultation_request_id: requestId,
    p_decision: decision,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  revalidateLead(requestId);
}

export async function brokerRespondAppointmentAction(formData: FormData) {
  const { supabase, broker, user } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const appointmentId = required(formData, "appointment_id");
  const action = required(formData, "action");
  if (!["accept", "reject", "suggest"].includes(action)) {
    throw new Error("Azione non valida.");
  }

  const { data: appt } = await supabase
    .from("consultation_appointments")
    .select("id, scheduled_at, duration_minutes, channel")
    .eq("id", appointmentId)
    .eq("broker_id", broker.id)
    .eq("consultation_request_id", requestId)
    .maybeSingle();
  if (!appt) throw new Error("Appuntamento non trovato.");

  if (action === "accept") {
    await supabase
      .from("consultation_appointments")
      .update({ status: "confirmed", proposal_status: "accepted" })
      .eq("id", appt.id);
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: requestId,
      actor_user_id: user!.id,
      actor_role: "broker",
      event_type: "confirmed",
      scheduled_at: appt.scheduled_at,
      duration_minutes: appt.duration_minutes,
      channel: appt.channel,
    });
  } else if (action === "reject") {
    await supabase
      .from("consultation_appointments")
      .update({ status: "cancelled", proposal_status: "declined" })
      .eq("id", appt.id);
  } else {
    const when = new Date(required(formData, "scheduled_at"));
    await supabase
      .from("consultation_appointments")
      .update({
        scheduled_at: when.toISOString(),
        status: "proposed",
        proposal_status: "pending",
        proposed_by: "broker",
        proposed_at: new Date().toISOString(),
      })
      .eq("id", appt.id);
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: requestId,
      actor_user_id: user!.id,
      actor_role: "broker",
      event_type: "proposed",
      scheduled_at: when.toISOString(),
      duration_minutes: appt.duration_minutes,
      channel: appt.channel,
    });
  }

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();
  if (request?.user_id) {
    await supabase.rpc("notify_user_activity", {
      p_user_id: request.user_id,
      p_consultation_id: requestId,
      p_event_type: "appointment_update",
      p_title:
        action === "accept"
          ? "Appuntamento confermato"
          : action === "suggest"
            ? "Nuova proposta appuntamento"
            : "Appuntamento annullato",
      p_body: null,
      p_href: `/consultations/${requestId}?tab=appointment`,
    });
  }

  revalidateLead(requestId);
  revalidatePath("/broker/appointments");
}

export async function sendConsultationMessageAction(formData: FormData) {
  const { supabase, user, role } = await requireOperationsRole(["broker", "admin"]);
  const requestId = required(formData, "request_id");
  const body = required(formData, "body").slice(0, 8000);
  const { error } = await supabase.from("consultation_messages").insert({
    consultation_request_id: requestId,
    sender_user_id: user!.id,
    sender_role: role === "admin" ? "admin" : "broker",
    message_kind: "user",
    body,
    is_internal: false,
  });
  if (error) throw new Error(error.message);

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();
  if (request?.user_id) {
    await supabase.rpc("notify_user_activity", {
      p_user_id: request.user_id,
      p_consultation_id: requestId,
      p_event_type: "broker_message",
      p_title: "Nuovo messaggio dal consulente",
      p_body: body.slice(0, 120),
      p_href: `/consultations/${requestId}?tab=messages`,
    });
  }

  revalidateLead(requestId);
}

export async function uploadOfferQuotePdfAction(formData: FormData) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const requestId = required(formData, "request_id");
  const offerId = required(formData, "offer_id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf") {
    throw new Error("Carica un PDF preventivo.");
  }
  if (file.size > 20 * 1024 * 1024) throw new Error("PDF troppo grande (max 20MB).");

  const bytes = Buffer.from(await file.arrayBuffer());
  const crypto = await import("node:crypto");
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "quote.pdf";
  const filePath = `quotes/${requestId}/${offerId}-${hash.slice(0, 12)}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("policy-documents")
    .upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) throw new Error(`Upload fallito: ${uploadError.message}`);

  const { error: regError } = await supabase.rpc("broker_register_offer_quote_document", {
    p_consultation_id: requestId,
    p_offer_id: offerId,
    p_file_name: safeName,
    p_file_path: filePath,
    p_file_size: file.size,
    p_mime_type: "application/pdf",
    p_file_hash: hash,
  });
  if (regError) {
    await supabase.storage.from("policy-documents").remove([filePath]);
    throw new Error(regError.message);
  }

  revalidateLead(requestId);
}

export async function analyzeOfferQuoteAction(formData: FormData) {
  const requestId = required(formData, "request_id");
  const offerId = required(formData, "offer_id");
  const { analyzeBrokerOfferQuote } = await import("@/lib/offer-quote-analysis");
  await analyzeBrokerOfferQuote(offerId);
  revalidateLead(requestId);
}

export async function verifyOfferQuoteAction(formData: FormData) {
  const requestId = required(formData, "request_id");
  const { verifyBrokerOfferExtraction } = await import("@/lib/offer-quote-analysis");
  const premium = value(formData, "premium_amount");
  await verifyBrokerOfferExtraction({
    offerId: required(formData, "offer_id"),
    insurer: required(formData, "insurer"),
    product: required(formData, "product"),
    category: required(formData, "category"),
    premiumAmount: premium ? Number(premium) : null,
    premiumFrequency: value(formData, "premium_frequency") || "annual",
    currency: value(formData, "currency") || "CHF",
    effectiveDate: value(formData, "effective_date") || null,
    quoteValidityDate: value(formData, "quote_validity_date") || null,
    sourcePolicyId: required(formData, "source_policy_id"),
    consumerNotes: value(formData, "consumer_notes") || null,
  });
  revalidateLead(requestId);
}

export async function createOfferRevisionAction(formData: FormData) {
  const { supabase } = await requireOperationsRole(["broker"]);
  const requestId = required(formData, "request_id");
  const offerId = required(formData, "offer_id");
  const { error } = await supabase.rpc("create_insurance_offer_revision", {
    p_offer_id: offerId,
  });
  if (error) throw new Error(error.message);
  revalidateLead(requestId);
}
