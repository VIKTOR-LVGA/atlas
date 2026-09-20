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
    const { data: rows, error } = await supabase.rpc("get_current_broker_profile");
    const data = rows?.[0] ?? null;
    if (error || !data) throw new OperationsAccessError("Profilo broker non attivo.");
    broker = {
      id: String(data.id),
      displayName: String(data.display_name),
      legalName: data.legal_name ? String(data.legal_name) : null,
      organizationName: data.organization_name ? String(data.organization_name) : null,
      email: data.email ? String(data.email) : null,
      active: Boolean(data.active),
    };
  }

  return { supabase, user, role, broker };
}

export async function requireOperationsRole(allowed: AtlasUserRole[]) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login");
  if (!identity.role || !allowed.includes(identity.role)) {
    if (identity.role === "broker") redirect("/broker");
    if (identity.role === "admin") redirect("/admin");
    redirect("/dashboard");
  }
  return identity;
}
