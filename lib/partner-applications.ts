import "server-only";

import { requireOperationsRole, getOperationsIdentity } from "@/lib/operations-access";
import { OperationsInputError } from "@/lib/operations-errors";
import {
  applyPartnerGeoPrivacy,
  type CantonAggregate,
} from "@/lib/partner-geo-privacy";
import type { SwissCantonCode } from "@/lib/swiss-cantons";

export type PartnerApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended";

export type PartnerType = "independent_broker" | "agency" | "general_agent" | "other";

export type PartnerApplicationInput = {
  firstName: string;
  lastName: string;
  organizationName?: string;
  legalName?: string;
  professionalEmail: string;
  phone: string;
  website?: string;
  partnerType: PartnerType;
  primaryCanton: string;
  servedCantons: string[];
  languages: string[];
  professionalId?: string;
  experienceNotes?: string;
  message?: string;
  consent: boolean;
  termsAccepted: boolean;
};

export type PartnerApplicationPublic = {
  id: string;
  status: PartnerApplicationStatus;
  firstName: string;
  lastName: string;
  organizationName: string | null;
  professionalEmail: string;
  primaryCanton: string;
  servedCantons: string[];
  languages: string[];
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

function mapApplication(row: Record<string, unknown>): PartnerApplicationPublic {
  return {
    id: String(row.id),
    status: row.status as PartnerApplicationStatus,
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    organizationName: row.organization_name ? String(row.organization_name) : null,
    professionalEmail: String(row.professional_email),
    primaryCanton: String(row.primary_canton),
    servedCantons: Array.isArray(row.served_cantons)
      ? row.served_cantons.map(String)
      : [],
    languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
  };
}

export async function getCurrentPartnerApplication() {
  const identity = await getOperationsIdentity();
  if (!identity.user) return null;
  const { data, error } = await identity.supabase
    .from("partner_applications")
    .select(
      "id, status, first_name, last_name, organization_name, professional_email, primary_canton, served_cantons, languages, rejection_reason, created_at, updated_at, reviewed_at"
    )
    .eq("user_id", identity.user.id)
    .maybeSingle();
  if (error) {
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      /partner_applications|schema cache|does not exist/i.test(error.message)
    ) {
      return null;
    }
    throw new Error("Candidatura non disponibile.");
  }
  return data ? mapApplication(data as Record<string, unknown>) : null;
}

export async function submitPartnerApplication(input: PartnerApplicationInput) {
  const identity = await getOperationsIdentity();
  if (!identity.user) throw new OperationsInputError("Accedi per inviare la candidatura.");
  if (identity.role !== "consumer") {
    throw new OperationsInputError("Solo un account consumer può candidarsi come partner.");
  }
  if (!input.consent || !input.termsAccepted) {
    throw new OperationsInputError("Consenso e termini partner sono obbligatori.");
  }
  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new OperationsInputError("Nome e cognome sono obbligatori.");
  }
  if (!input.professionalEmail.includes("@") || !input.phone.trim()) {
    throw new OperationsInputError("Email professionale e telefono sono obbligatori.");
  }
  if (!input.primaryCanton.trim()) {
    throw new OperationsInputError("Seleziona il cantone principale.");
  }

  const payload = {
    user_id: identity.user.id,
    first_name: input.firstName.trim().slice(0, 80),
    last_name: input.lastName.trim().slice(0, 80),
    organization_name: input.organizationName?.trim() || null,
    legal_name: input.legalName?.trim() || null,
    professional_email: input.professionalEmail.trim().toLowerCase(),
    phone: input.phone.trim().slice(0, 40),
    website: input.website?.trim() || null,
    partner_type: input.partnerType,
    primary_canton: input.primaryCanton.trim().toUpperCase(),
    served_cantons: input.servedCantons.map((c) => c.toUpperCase()),
    languages: input.languages,
    professional_id: input.professionalId?.trim() || null,
    experience_notes: input.experienceNotes?.trim().slice(0, 4000) || null,
    message: input.message?.trim().slice(0, 4000) || null,
    consent_given_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
    status: "submitted" as const,
  };

  const existing = await getCurrentPartnerApplication();
  if (existing && !["draft", "rejected"].includes(existing.status)) {
    throw new OperationsInputError("Hai già una candidatura in corso.");
  }

  if (existing && ["draft", "rejected"].includes(existing.status)) {
    const { data, error } = await identity.supabase
      .from("partner_applications")
      .update(payload)
      .eq("id", existing.id)
      .select(
        "id, status, first_name, last_name, organization_name, professional_email, primary_canton, served_cantons, languages, rejection_reason, created_at, updated_at, reviewed_at"
      )
      .single();
    if (error) throw new OperationsInputError("Impossibile aggiornare la candidatura.");
    return mapApplication(data as Record<string, unknown>);
  }

  const { data, error } = await identity.supabase
    .from("partner_applications")
    .insert(payload)
    .select(
      "id, status, first_name, last_name, organization_name, professional_email, primary_canton, served_cantons, languages, rejection_reason, created_at, updated_at, reviewed_at"
    )
    .single();
  if (error) {
    throw new OperationsInputError(
      error.code === "23505"
        ? "Esiste già una candidatura per questo account."
        : "Candidatura non inviata. Verifica i dati."
    );
  }
  return mapApplication(data as Record<string, unknown>);
}

export async function listPartnerApplicationsForAdmin() {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    // Table may not exist until the onboarding migration is applied.
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      /partner_applications|schema cache|does not exist/i.test(error.message)
    ) {
      return [];
    }
    throw new Error("Candidature non disponibili.");
  }
  return data ?? [];
}

export async function reviewPartnerApplication(input: {
  applicationId: string;
  decision: "approve" | "reject" | "under_review" | "suspend";
  adminNotes?: string;
  rejectionReason?: string;
}) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { data, error } = await supabase.rpc("review_partner_application", {
    p_application_id: input.applicationId,
    p_decision: input.decision,
    p_admin_notes: input.adminNotes ?? null,
    p_rejection_reason: input.rejectionReason ?? null,
  });
  if (error) {
    throw new OperationsInputError("Operazione non applicata. Ricarica e riprova.");
  }
  return data;
}

export type { CantonAggregate };
export { applyPartnerGeoPrivacy };

export async function getCantonAggregates(scope: "admin" | "partner", brokerId?: string) {
  const identity = await requireOperationsRole(
    scope === "admin" ? ["admin"] : ["broker"]
  );
  const { data, error } = await identity.supabase.rpc("get_canton_aggregates", {
    p_scope: scope,
    p_broker_id: brokerId ?? null,
  });
  if (error) throw new Error("Aggregazioni cantonali non disponibili.");
  const rows = (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) => ({
    canton: String(row.canton ?? "UNKNOWN"),
    leads: Number(row.leads ?? 0),
    clients: Number(row.clients ?? 0),
    contracts: Number(row.contracts ?? 0),
    brokerRevenue: Number(row.broker_revenue ?? 0),
    grossCommission: Number(row.gross_commission ?? 0),
    atlasRevenue: Number(row.atlas_revenue ?? 0),
  }));
  return scope === "partner" ? applyPartnerGeoPrivacy(rows) : rows;
}

export type { SwissCantonCode };
