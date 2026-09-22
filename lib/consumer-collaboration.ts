import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { comparePolicyToOffer } from "@/lib/offer-comparison";
import {
  consumerConsultationStatusLabel,
  consumerNextAction,
  reviewReasonLabel,
} from "@/lib/collaboration-status";

export class CollaborationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollaborationError";
  }
}

async function current() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new CollaborationError("Accedi di nuovo.");
  return { supabase, user };
}

export async function getConsumerConsultationDetail(id: string) {
  const { supabase, user } = await current();
  const { data: request, error } = await supabase
    .from("consultation_requests")
    .select(
      "id, status, request_type, message, preferred_contact_method, preferred_contact_time, consent_given_at, privacy_version, source_opportunity_id, review_reason, review_reason_detail, assigned_broker_id, created_at, updated_at, closed_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !request) throw new CollaborationError("Pratica non trovata.");

  const [
    { data: broker },
    { data: shared },
    { data: messages },
    { data: appointments },
    { data: offers },
    { data: events },
  ] = await Promise.all([
    request.assigned_broker_id
      ? supabase
          .from("brokers")
          .select("id, display_name, company_name")
          .eq("id", request.assigned_broker_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("consultation_shared_resources")
      .select("id, resource_type, resource_id, created_at")
      .eq("consultation_request_id", id)
      .is("revoked_at", null),
    supabase
      .from("consultation_messages")
      .select("id, sender_role, body, created_at, read_at, message_kind, is_internal")
      .eq("consultation_request_id", id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("consultation_appointments")
      .select(
        "id, scheduled_at, duration_minutes, channel, location_or_link, status, notes, proposal_status, proposed_by, proposed_at, proposal_note, created_at"
      )
      .eq("consultation_request_id", id)
      .order("scheduled_at", { ascending: false })
      .limit(5),
    supabase
      .from("insurance_offers")
      .select(
        "id, insurer, product, policy_category, premium_amount, premium_frequency, status, source_policy_id, quote_validity_date, effective_date, currency, consumer_visible_notes, version, viewed_at, consumer_decision, consumer_decision_at, proposed_at, created_at, quote_document_id"
      )
      .eq("consultation_request_id", id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("consultation_events")
      .select("id, event_type, created_at, metadata, actor_type")
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const appointment = appointments?.[0] ?? null;
  const latestOffer = offers?.[0] ?? null;
  const visibleMessages = (messages ?? []).filter((m) => !m.is_internal);
  const unreadFromBroker = visibleMessages.filter(
    (m) => m.sender_role === "broker" && !m.read_at
  ).length;

  const next = consumerNextAction({
    status: request.status,
    hasUnreadMessages: unreadFromBroker > 0,
    appointmentStatus: appointment?.status ?? null,
    offerStatus: latestOffer?.status ?? null,
    consultationId: id,
  });

  return {
    request: {
      ...request,
      statusLabel: consumerConsultationStatusLabel(request.status),
      reasonLabel: request.review_reason
        ? reviewReasonLabel(request.review_reason)
        : null,
    },
    broker,
    shared: shared ?? [],
    messages: visibleMessages,
    appointments: appointments ?? [],
    appointment,
    offers: offers ?? [],
    events: events ?? [],
    unreadFromBroker,
    nextAction: next,
  };
}

export async function sendConsumerConsultationMessage(consultationId: string, body: string) {
  const text = body.trim().slice(0, 4000);
  if (!text) throw new CollaborationError("Messaggio vuoto.");
  const { supabase, user } = await current();
  const { data: request } = await supabase
    .from("consultation_requests")
    .select("id, assigned_broker_id, user_id")
    .eq("id", consultationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) throw new CollaborationError("Pratica non trovata.");

  const { error } = await supabase.from("consultation_messages").insert({
    consultation_request_id: consultationId,
    sender_user_id: user.id,
    sender_role: "consumer",
    message_kind: "user",
    body: text,
    is_internal: false,
  });
  if (error) throw new CollaborationError("Messaggio non inviato.");

  if (request.assigned_broker_id) {
    const { data: broker } = await supabase
      .from("brokers")
      .select("auth_user_id")
      .eq("id", request.assigned_broker_id)
      .maybeSingle();
    if (broker?.auth_user_id) {
      await supabase.rpc("notify_user_activity", {
        p_user_id: broker.auth_user_id,
        p_consultation_id: consultationId,
        p_event_type: "consumer_message",
        p_title: "Nuovo messaggio dal cliente",
        p_body: text.slice(0, 120),
        p_href: `/broker/requests/${consultationId}?tab=messages`,
      });
    }
  }
}

export async function markConsumerMessagesRead(consultationId: string) {
  const { supabase, user } = await current();
  await supabase
    .from("consultation_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("consultation_request_id", consultationId)
    .eq("sender_role", "broker")
    .is("read_at", null)
    .eq("is_internal", false);
  // ownership enforced by RLS + we verify consultation ownership
  const { data } = await supabase
    .from("consultation_requests")
    .select("id")
    .eq("id", consultationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new CollaborationError("Pratica non trovata.");
}

export async function consumerRespondToAppointment(input: {
  appointmentId: string;
  action: "confirm" | "decline" | "counter";
  scheduledAt?: string;
  note?: string;
}) {
  const { supabase, user } = await current();
  const { data: appt } = await supabase
    .from("consultation_appointments")
    .select("id, consultation_request_id, scheduled_at, duration_minutes, channel, status, broker_id")
    .eq("id", input.appointmentId)
    .maybeSingle();
  if (!appt) throw new CollaborationError("Appuntamento non trovato.");

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("id, user_id, assigned_broker_id")
    .eq("id", appt.consultation_request_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) throw new CollaborationError("Pratica non trovata.");

  if (input.action === "confirm") {
    await supabase
      .from("consultation_appointments")
      .update({
        status: "confirmed",
        proposal_status: "accepted",
      })
      .eq("id", appt.id);
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: appt.consultation_request_id,
      actor_user_id: user.id,
      actor_role: "consumer",
      event_type: "confirmed",
      scheduled_at: appt.scheduled_at,
      duration_minutes: appt.duration_minutes,
      channel: appt.channel,
    });
    await supabase
      .from("consultation_requests")
      .update({ status: "consultation_scheduled" })
      .eq("id", request.id);
  } else if (input.action === "decline") {
    await supabase
      .from("consultation_appointments")
      .update({ status: "cancelled", proposal_status: "declined" })
      .eq("id", appt.id);
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: appt.consultation_request_id,
      actor_user_id: user.id,
      actor_role: "consumer",
      event_type: "declined",
      note: input.note?.slice(0, 500) ?? null,
    });
  } else {
    if (!input.scheduledAt) throw new CollaborationError("Indica data e ora.");
    const when = new Date(input.scheduledAt);
    if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) {
      throw new CollaborationError("Orario non valido.");
    }
    await supabase
      .from("consultation_appointments")
      .update({
        scheduled_at: when.toISOString(),
        status: "counter_proposed",
        proposal_status: "pending",
        proposed_by: "consumer",
        proposed_at: new Date().toISOString(),
        proposal_note: input.note?.slice(0, 500) ?? null,
      })
      .eq("id", appt.id);
    await supabase.from("consultation_appointment_events").insert({
      appointment_id: appt.id,
      consultation_request_id: appt.consultation_request_id,
      actor_user_id: user.id,
      actor_role: "consumer",
      event_type: "counter_proposed",
      scheduled_at: when.toISOString(),
      duration_minutes: appt.duration_minutes,
      channel: appt.channel,
      note: input.note?.slice(0, 500) ?? null,
    });
    await supabase
      .from("consultation_requests")
      .update({ status: "consultation_scheduled" })
      .eq("id", request.id);
  }

  // notify broker
  const { data: broker } = await supabase
    .from("brokers")
    .select("auth_user_id")
    .eq("id", appt.broker_id)
    .maybeSingle();
  if (broker?.auth_user_id) {
    await supabase.rpc("notify_user_activity", {
      p_user_id: broker.auth_user_id,
      p_consultation_id: appt.consultation_request_id,
      p_event_type: "appointment_response",
      p_title:
        input.action === "confirm"
          ? "Appuntamento confermato"
          : input.action === "counter"
            ? "Controproposta appuntamento"
            : "Appuntamento rifiutato",
      p_body: null,
      p_href: `/broker/requests/${appt.consultation_request_id}?tab=appointment`,
    });
  }
}

export async function getConsumerOfferComparison(offerId: string) {
  const { supabase, user } = await current();
  const { data: offer } = await supabase
    .from("insurance_offers")
    .select(
      "*, consultation_request_id, source_policy_id, consumer_visible_notes, quote_document_id"
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) throw new CollaborationError("Offerta non trovata.");

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("id, user_id")
    .eq("id", offer.consultation_request_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) throw new CollaborationError("Offerta non trovata.");

  // mark viewed
  if (!offer.viewed_at && ["proposed", "sent"].includes(offer.status)) {
    await supabase
      .from("insurance_offers")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", offer.id);
  }

  let currentPremium: number | null = null;
  let currentFrequency: string | null = "annual";
  let currentCoverages: Array<{ code?: string; label: string; deductible?: number | null }> = [];
  let currentDeductible: number | null = null;

  if (offer.source_policy_id) {
    const { data: policy } = await supabase
      .from("policies")
      .select("id, premium_amount, premium_frequency, deductible, provider, policy_type")
      .eq("id", offer.source_policy_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (policy) {
      currentPremium = policy.premium_amount != null ? Number(policy.premium_amount) : null;
      currentFrequency = policy.premium_frequency ?? "annual";
      currentDeductible =
        policy.deductible != null ? Number(policy.deductible) : null;
    }
    const { data: coverages } = await supabase
      .from("policy_coverages")
      .select("canonical_type, original_label, deductible")
      .eq("policy_id", offer.source_policy_id)
      .eq("coverage_status", "included");
    currentCoverages = (coverages ?? []).map((c) => ({
      code: c.canonical_type,
      label: c.original_label || c.canonical_type || "Copertura",
      deductible: c.deductible != null ? Number(c.deductible) : null,
    }));
  }

  const { data: offerItems } = await supabase
    .from("insurance_offer_items")
    .select("item_kind, code, label, value_text, value_numeric")
    .eq("offer_id", offer.id);

  const offerCoverages = (offerItems ?? [])
    .filter((i) => i.item_kind === "coverage")
    .map((i) => ({
      code: i.code,
      label: i.label,
      deductible: i.value_numeric != null ? Number(i.value_numeric) : null,
    }));

  const meta = (offer.metadata ?? {}) as Record<string, unknown>;
  const offerDeductible =
    meta.deductible != null
      ? Number(meta.deductible)
      : (offerItems ?? []).find((i) => i.item_kind === "deductible")?.value_numeric != null
        ? Number((offerItems ?? []).find((i) => i.item_kind === "deductible")!.value_numeric)
        : null;

  const comparison = comparePolicyToOffer({
    currency: offer.currency ?? "CHF",
    currentPremium,
    currentFrequency,
    offerPremium: offer.premium_amount != null ? Number(offer.premium_amount) : null,
    offerFrequency: offer.premium_frequency,
    currentCoverages,
    offerCoverages,
    currentDeductible,
    offerDeductible,
  });

  return { offer, comparison };
}

export async function consumerDecideOffer(input: {
  offerId: string;
  decision: "interested" | "clarification" | "declined" | "request_appointment";
  note?: string;
}) {
  const { supabase, user } = await current();
  const { data: offer } = await supabase
    .from("insurance_offers")
    .select("id, consultation_request_id, broker_id, status")
    .eq("id", input.offerId)
    .maybeSingle();
  if (!offer) throw new CollaborationError("Offerta non trovata.");

  const { data: request } = await supabase
    .from("consultation_requests")
    .select("id, user_id")
    .eq("id", offer.consultation_request_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) throw new CollaborationError("Offerta non trovata.");

  const statusMap = {
    interested: "interested",
    clarification: "clarification_requested",
    declined: "declined",
    request_appointment: "clarification_requested",
  } as const;

  await supabase
    .from("insurance_offers")
    .update({
      status: statusMap[input.decision],
      consumer_decision: input.decision,
      consumer_decision_at: new Date().toISOString(),
      consumer_decision_note: input.note?.slice(0, 1000) ?? null,
    })
    .eq("id", offer.id);

  await supabase
    .from("consultation_requests")
    .update({ status: "quoted" })
    .eq("id", request.id);

  if (input.decision === "clarification" || input.decision === "request_appointment") {
    const text =
      input.decision === "request_appointment"
        ? `Il cliente richiede un appuntamento. ${input.note ?? ""}`.trim()
        : `Chiarimento: ${input.note ?? ""}`.trim();
    await supabase.from("consultation_messages").insert({
      consultation_request_id: request.id,
      sender_user_id: user.id,
      sender_role: "consumer",
      message_kind: "user",
      body: text.slice(0, 4000),
      is_internal: false,
    });
  }

  const { data: broker } = await supabase
    .from("brokers")
    .select("auth_user_id")
    .eq("id", offer.broker_id)
    .maybeSingle();
  if (broker?.auth_user_id) {
    await supabase.rpc("notify_user_activity", {
      p_user_id: broker.auth_user_id,
      p_consultation_id: request.id,
      p_event_type: "offer_decision",
      p_title: `Decisione offerta: ${input.decision}`,
      p_body: input.note?.slice(0, 120) ?? null,
      p_href: `/broker/requests/${request.id}?tab=offers`,
    });
  }
}
