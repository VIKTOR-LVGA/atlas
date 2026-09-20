import "server-only";

import { requireOperationsRole } from "@/lib/operations-access";

type UnknownRow = Record<string, unknown>;

function num(value: unknown) {
  return Number(value ?? 0);
}

export async function getBrokerWorkspace() {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const [{ data: requests, error: requestError }, { data: revenue, error: revenueError }, appointmentsResult, contractsResult, ledgerResult] = await Promise.all([
    supabase
      .from("consultation_requests")
      .select("id, user_id, status, request_type, message, preferred_contact_method, preferred_contact_time, source, created_at, updated_at")
      .eq("assigned_broker_id", broker.id)
      .order("updated_at", { ascending: false }),
    supabase.rpc("get_broker_revenue_summary"),
    supabase.from("consultation_appointments").select("id", { count: "exact", head: true }),
    supabase.from("broker_contracts").select("id, user_id, consultation_request_id, insurer, product, category, status, contract_start_date, created_at").order("created_at", { ascending: false }),
    supabase.rpc("get_broker_commission_ledger"),
  ]);
  if (requestError) throw new Error("Pipeline non disponibile.");
  if (revenueError) throw new Error("Metriche commissioni non disponibili.");
  if (appointmentsResult.error || contractsResult.error || ledgerResult.error) throw new Error("Dati operativi non disponibili.");

  const userIds = [...new Set((requests ?? []).map((row) => String(row.user_id)))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds)
    : { data: [], error: null };
  if (profileError) throw new Error("Profili clienti non disponibili.");
  const profileById = new Map((profiles ?? []).map((row) => [String(row.id), row]));
  const leads = (requests ?? []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    clientName: String(profileById.get(String(row.user_id))?.full_name ?? "Cliente ATLAS"),
    clientEmail: profileById.get(String(row.user_id))?.email ? String(profileById.get(String(row.user_id))?.email) : null,
    clientPhone: profileById.get(String(row.user_id))?.phone ? String(profileById.get(String(row.user_id))?.phone) : null,
    status: String(row.status),
    requestType: String(row.request_type),
    message: row.message ? String(row.message) : null,
    preferredContactMethod: row.preferred_contact_method ? String(row.preferred_contact_method) : null,
    preferredContactTime: row.preferred_contact_time ? String(row.preferred_contact_time) : null,
    source: String(row.source ?? "atlas"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
  const summaryRow = ((revenue ?? [])[0] ?? {}) as UnknownRow;
  return {
    broker,
    leads,
    pipeline: leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.status] = (acc[lead.status] ?? 0) + 1;
      return acc;
    }, {}),
    revenue: {
      brokerShare: num(summaryRow.broker_share),
      expectedShare: num(summaryRow.expected_share),
      paidShare: num(summaryRow.paid_share),
      clawbackShare: num(summaryRow.clawback_share),
      netBrokerRevenue: num(summaryRow.net_broker_revenue),
    },
    appointmentCount: appointmentsResult.count ?? 0,
    contracts: contractsResult.data ?? [],
    ledger: ledgerResult.data ?? [],
  };
}

export async function getBrokerLeadDetail(id: string) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const { data: request, error } = await supabase
    .from("consultation_requests")
    .select("id, user_id, status, request_type, message, preferred_contact_method, preferred_contact_time, source, created_at, updated_at")
    .eq("id", id)
    .eq("assigned_broker_id", broker.id)
    .maybeSingle();
  if (error || !request) return null;

  const [{ data: profile }, { data: shares }, { data: notes }, { data: appointments }, { data: offers }, { data: contracts }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone").eq("id", request.user_id).maybeSingle(),
    supabase.from("consultation_shared_resources").select("id, resource_type, resource_id, shared_at, revoked_at").eq("consultation_request_id", id).is("revoked_at", null),
    supabase.from("broker_notes").select("id, content, created_at, updated_at").eq("consultation_request_id", id).order("created_at", { ascending: false }),
    supabase.from("consultation_appointments").select("id, scheduled_at, duration_minutes, channel, location_or_link, status, notes").eq("consultation_request_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("insurance_offers").select("id, insurer, product, policy_category, premium_amount, premium_frequency, status, proposed_at, created_at").eq("consultation_request_id", id).order("created_at", { ascending: false }),
    supabase.from("broker_contracts").select("id, insurer, product, category, external_policy_number, contract_start_date, contract_end_date, status, created_at").eq("consultation_request_id", id).order("created_at", { ascending: false }),
    supabase.from("consultation_events").select("id, event_type, actor_type, metadata, created_at").eq("consultation_request_id", id).order("created_at", { ascending: false }),
  ]);

  const resources = { policies: [] as UnknownRow[], documents: [] as UnknownRow[] };
  const policyIds = (shares ?? []).filter((r) => r.resource_type === "policy").map((r) => String(r.resource_id));
  const documentIds = (shares ?? []).filter((r) => r.resource_type === "document").map((r) => String(r.resource_id));
  if (policyIds.length) {
    const { data } = await supabase.from("policies").select("id, provider, policy_type, policy_number, premium_amount, premium_frequency, renewal_date, currency").in("id", policyIds);
    resources.policies = data ?? [];
  }
  if (documentIds.length) {
    const { data } = await supabase.from("documents").select("id, file_name, document_type, status, created_at").in("id", documentIds);
    resources.documents = data ?? [];
  }

  return { request, profile, shares: shares ?? [], resources, notes: notes ?? [], appointments: appointments ?? [], offers: offers ?? [], contracts: contracts ?? [], events: events ?? [] };
}

export async function getBrokerCommissionLedger() {
  const { supabase } = await requireOperationsRole(["broker"]);
  const { data, error } = await supabase.rpc("get_broker_commission_ledger");
  if (error) throw new Error("Ledger commissioni non disponibile.");
  return data ?? [];
}
