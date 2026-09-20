import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AtlasUserRole, BrokerIdentity } from "@/lib/types";

export class OperationsAccessError extends Error {
  constructor(message = "Non hai accesso a questa area.") {
    super(message);
    this.name = "OperationsAccessError";
  }
}

export async function getOperationsIdentity() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, role: null, broker: null };

  const { data: roleValue, error: roleError } = await supabase.rpc("current_user_role");
  if (roleError) throw new OperationsAccessError("Ruolo operativo non disponibile.");
  const role = roleValue as AtlasUserRole;

  let broker: BrokerIdentity | null = null;
  if (role === "broker") {
    const { data: rows, error } = await supabase.rpc("get_current_partner_profile");
    const data = rows?.[0] ?? null;
    if (error || !data) throw new OperationsAccessError("Profilo broker non attivo.");
    broker = {
      id: String(data.id),
      displayName: String(data.display_name),
      legalName: data.legal_name ? String(data.legal_name) : null,
      organizationName: data.organization_name ? String(data.organization_name) : null,
      email: data.email ? String(data.email) : null,
      active: Boolean(data.active),
      website: data.website ? String(data.website) : null,
      partnerType: data.partner_type ? String(data.partner_type) : null,
      primaryCanton: data.primary_canton ? String(data.primary_canton) : null,
      servedCantons: Array.isArray(data.served_cantons)
        ? data.served_cantons.map(String)
        : [],
      languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
      professionalId: data.professional_id ? String(data.professional_id) : null,
      experienceNotes: data.experience_notes ? String(data.experience_notes) : null,
    };
  }

  return { supabase, user, role, broker };
}

export async function requireOperationsRole(allowed: AtlasUserRole[]) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login");
  if (!identity.role || !allowed.includes(identity.role)) {
    if (identity.role === "broker") redirect("/partner/dashboard");
    if (identity.role === "admin") redirect("/control-center");
    redirect("/dashboard");
  }
  return identity;
}

/** Deny without redirect — for soft gates and tests. */
export async function assertOperationsRole(allowed: AtlasUserRole[]) {
  const identity = await getOperationsIdentity();
  if (!identity.user || !identity.role || !allowed.includes(identity.role)) {
    throw new OperationsAccessError();
  }
  return identity;
}
