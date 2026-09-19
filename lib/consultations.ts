import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsultationRequest } from "@/lib/types";

export const CONSULTATION_PRIVACY_VERSION = "atlas-consultation-2026-09";

export type ConsultationRequestInput = {
  requestType?: ConsultationRequest["requestType"];
  message?: string | null;
  preferredContactMethod?: ConsultationRequest["preferredContactMethod"];
  preferredContactTime?: string | null;
  sourceOpportunityId?: string | null;
  consent: boolean;
};

export class ConsultationDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsultationDataError";
  }
}

function toConsultation(row: Record<string, unknown>): ConsultationRequest {
  return {
    id: String(row.id),
    status: row.status as ConsultationRequest["status"],
    requestType: row.request_type as ConsultationRequest["requestType"],
    message: row.message ? String(row.message) : null,
    preferredContactMethod: (row.preferred_contact_method as ConsultationRequest["preferredContactMethod"]) ?? null,
    preferredContactTime: row.preferred_contact_time ? String(row.preferred_contact_time) : null,
    consentGivenAt: String(row.consent_given_at),
    privacyVersion: row.privacy_version ? String(row.privacy_version) : null,
    sourceOpportunityId: row.source_opportunity_id ? String(row.source_opportunity_id) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    closedAt: row.closed_at ? String(row.closed_at) : null,
  };
}

async function current() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ConsultationDataError("Accedi di nuovo per continuare.");
  return { supabase, user };
}

export async function listCurrentUserConsultationRequests() {
  const { supabase, user } = await current();
  const { data, error } = await supabase
    .from("consultation_requests")
    .select("id, status, request_type, message, preferred_contact_method, preferred_contact_time, consent_given_at, privacy_version, source_opportunity_id, created_at, updated_at, closed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new ConsultationDataError("Richieste non disponibili.");
  return (data ?? []).map((row) => toConsultation(row));
}

export async function createConsultationRequest(input: ConsultationRequestInput) {
  if (!input.consent) {
    throw new ConsultationDataError("Il consenso esplicito e necessario per inviare la richiesta.");
  }
  if (input.preferredContactMethod && !["email", "phone"].includes(input.preferredContactMethod)) {
    throw new ConsultationDataError("Modalita di contatto non valida.");
  }
  const message = input.message?.trim().slice(0, 4000) || null;
  const preferredContactTime = input.preferredContactTime?.trim().slice(0, 240) || null;
  const { supabase, user } = await current();

  const { data: existing } = await supabase
    .from("consultation_requests")
    .select("id, status, request_type, message, preferred_contact_method, preferred_contact_time, consent_given_at, privacy_version, source_opportunity_id, created_at, updated_at, closed_at")
    .eq("user_id", user.id)
    .not("status", "in", "(completed,cancelled)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return toConsultation(existing);

  const { data, error } = await supabase.from("consultation_requests").insert({
    user_id: user.id,
    request_type: input.requestType ?? "portfolio_review",
    message,
    preferred_contact_method: input.preferredContactMethod ?? null,
    preferred_contact_time: preferredContactTime,
    consent_given_at: new Date().toISOString(),
    privacy_version: CONSULTATION_PRIVACY_VERSION,
    source_opportunity_id: input.sourceOpportunityId ?? null,
  }).select("id, status, request_type, message, preferred_contact_method, preferred_contact_time, consent_given_at, privacy_version, source_opportunity_id, created_at, updated_at, closed_at").single();
  if (error || !data) throw new ConsultationDataError("Richiesta non inviata.");
  return toConsultation(data);
}
