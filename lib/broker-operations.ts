import "server-only";

import { requireOperationsRole } from "@/lib/operations-access";

type UnknownRow = Record<string, unknown>;

function num(value: unknown) {
  return Number(value ?? 0);
}

export async function getBrokerWorkspace() {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const [
    { data: requests, error: requestError },
    { data: revenue, error: revenueError },
    appointmentsResult,
    contractsResult,
    ledgerResult,
    offersResult,
  ] = await Promise.all([
    supabase
      .from("consultation_requests")
      .select(
        "id, user_id, status, request_type, message, preferred_contact_method, preferred_contact_time, source, created_at, updated_at"
      )
      .eq("assigned_broker_id", broker.id)
      .order("updated_at", { ascending: false }),
    supabase.rpc("get_broker_revenue_summary"),
    supabase
      .from("consultation_appointments")
      .select(
        "id, consultation_request_id, scheduled_at, duration_minutes, channel, status, location_or_link, notes"
      )
      .eq("broker_id", broker.id)
      .order("scheduled_at", { ascending: true })
      .limit(200),
    supabase
      .from("broker_contracts")
      .select(
        "id, user_id, consultation_request_id, insurer, product, category, status, contract_start_date, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.rpc("get_broker_commission_ledger"),
    supabase
      .from("insurance_offers")
      .select(
        "id, consultation_request_id, insurer, product, policy_category, premium_amount, status, created_at, proposed_at"
      )
      .eq("broker_id", broker.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (requestError) throw new Error("Pipeline non disponibile.");
  if (revenueError) throw new Error("Metriche commissioni non disponibili.");
  if (appointmentsResult.error || contractsResult.error || ledgerResult.error || offersResult.error) {
    throw new Error("Dati operativi non disponibili.");
  }

  const userIds = [...new Set((requests ?? []).map((row) => String(row.user_id)))];
  const requestIds = (requests ?? []).map((row) => String(row.id));
  const [{ data: profiles, error: profileError }, eventsResult] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? supabase
          .from("consultation_events")
          .select("id, consultation_request_id, event_type, actor_type, metadata, created_at")
          .in("consultation_request_id", requestIds)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileError) throw new Error("Profili clienti non disponibili.");

  const profileById = new Map((profiles ?? []).map((row) => [String(row.id), row]));
  const leads = (requests ?? []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    clientName: String(profileById.get(String(row.user_id))?.full_name ?? "Cliente ATLAS"),
    clientEmail: profileById.get(String(row.user_id))?.email
      ? String(profileById.get(String(row.user_id))?.email)
      : null,
    clientPhone: profileById.get(String(row.user_id))?.phone
      ? String(profileById.get(String(row.user_id))?.phone)
      : null,
    status: String(row.status),
    requestType: String(row.request_type),
    message: row.message ? String(row.message) : null,
    preferredContactMethod: row.preferred_contact_method
      ? String(row.preferred_contact_method)
      : null,
    preferredContactTime: row.preferred_contact_time
      ? String(row.preferred_contact_time)
      : null,
    source: String(row.source ?? "atlas"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const appointments = (appointmentsResult.data ?? []).map((row) => ({
    ...row,
    clientName: leadById.get(String(row.consultation_request_id))?.clientName,
  }));
  const offers = (offersResult.data ?? []).map((row) => ({
    ...row,
    clientName: leadById.get(String(row.consultation_request_id))?.clientName,
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
    appointmentCount: appointments.length,
    appointments,
    offers,
    contracts: contractsResult.data ?? [],
    ledger: ledgerResult.data ?? [],
    events: eventsResult.data ?? [],
  };
}

export async function getBrokerLeadDetail(id: string) {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");
  const { data: request, error } = await supabase
    .from("consultation_requests")
    .select(
      "id, user_id, status, request_type, message, preferred_contact_method, preferred_contact_time, source, created_at, updated_at, broker_acceptance, broker_decline_reason, broker_accepted_at, broker_declined_at"
    )
    .eq("id", id)
    .eq("assigned_broker_id", broker.id)
    .maybeSingle();
  if (error || !request) return null;

  const [
    { data: profile },
    { data: shares },
    { data: notes },
    { data: appointments },
    { data: offers },
    { data: contracts },
    { data: events },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", request.user_id)
      .maybeSingle(),
    supabase
      .from("consultation_shared_resources")
      .select("id, resource_type, resource_id, shared_at, revoked_at")
      .eq("consultation_request_id", id)
      .is("revoked_at", null),
    supabase
      .from("broker_notes")
      .select("id, content, created_at, updated_at")
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("consultation_appointments")
      .select(
        "id, scheduled_at, duration_minutes, channel, location_or_link, status, notes"
      )
      .eq("consultation_request_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("insurance_offers")
      .select(
        "id, insurer, product, policy_category, premium_amount, premium_frequency, status, proposed_at, created_at, source_policy_id, quote_document_id, extraction_status, extraction_error, verified_at, version, is_current, parent_offer_id, currency, effective_date, quote_validity_date, consumer_visible_notes, consumer_decision"
      )
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("broker_contracts")
      .select(
        "id, insurer, product, category, external_policy_number, contract_start_date, contract_end_date, status, created_at"
      )
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("consultation_events")
      .select("id, event_type, actor_type, metadata, created_at")
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("consultation_messages")
      .select("id, sender_role, message_kind, body, created_at")
      .eq("consultation_request_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  const resources = { policies: [] as UnknownRow[], documents: [] as UnknownRow[] };
  const policyIds = (shares ?? [])
    .filter((r) => r.resource_type === "policy")
    .map((r) => String(r.resource_id));
  const documentIds = (shares ?? [])
    .filter((r) => r.resource_type === "document")
    .map((r) => String(r.resource_id));
  if (policyIds.length) {
    const { data } = await supabase
      .from("policies")
      .select(
        "id, provider, policy_type, policy_number, premium_amount, premium_frequency, renewal_date, currency"
      )
      .in("id", policyIds);
    resources.policies = data ?? [];
  }
  if (documentIds.length) {
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, document_type, status, created_at")
      .in("id", documentIds);
    resources.documents = data ?? [];
  }

  return {
    request,
    profile,
    shares: shares ?? [],
    resources,
    notes: notes ?? [],
    appointments: appointments ?? [],
    offers: offers ?? [],
    contracts: contracts ?? [],
    events: events ?? [],
    messages: messages ?? [],
  };
}

export async function getBrokerClient360(userId: string) {
  const workspace = await getBrokerWorkspace();
  const clientLeads = workspace.leads.filter((lead) => lead.userId === userId);
  if (!clientLeads.length) return null;

  const details = await Promise.all(
    clientLeads.slice(0, 8).map((lead) => getBrokerLeadDetail(lead.id))
  );
  const valid = details.filter(Boolean);

  const notes = valid.flatMap((d) =>
    (d!.notes ?? []).map((note) => ({
      ...note,
      consultation_request_id: String(d!.request.id),
    }))
  );
  const appointments = valid.flatMap((d) =>
    (d!.appointments ?? []).map((row) => ({
      ...row,
      consultation_request_id: String(d!.request.id),
    }))
  );
  const offers = valid.flatMap((d) =>
    (d!.offers ?? []).map((row) => ({
      ...row,
      consultation_request_id: String(d!.request.id),
    }))
  );
  const contracts = workspace.contracts.filter((c) => c.user_id === userId);
  const events = valid
    .flatMap((d) =>
      (d!.events ?? []).map((event) => ({
        ...event,
        consultation_request_id: String(d!.request.id),
      }))
    )
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const policies = new Map<string, UnknownRow>();
  const documents = new Map<string, UnknownRow>();
  for (const detail of valid) {
    for (const policy of detail!.resources.policies) {
      policies.set(String(policy.id), policy);
    }
    for (const document of detail!.resources.documents) {
      documents.set(String(document.id), document);
    }
  }

  const primary = clientLeads[0];
  const openLead =
    clientLeads.find(
      (lead) => !["won", "lost", "completed", "cancelled"].includes(lead.status)
    ) ?? primary;

  return {
    broker: workspace.broker,
    client: primary,
    leads: clientLeads,
    openLead,
    notes,
    appointments,
    offers,
    contracts,
    events,
    policies: [...policies.values()],
    documents: [...documents.values()],
    ledger: workspace.ledger.filter((entry: { consultation_request_id?: string }) =>
      clientLeads.some((lead) => lead.id === entry.consultation_request_id)
    ),
  };
}

export async function searchPartnerWorkspace(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { clients: [], leads: [], contracts: [], offers: [] };

  const workspace = await getBrokerWorkspace();
  const clients = [
    ...new Map(workspace.leads.map((lead) => [lead.userId, lead])).values(),
  ]
    .filter((client) => {
      const hay = `${client.clientName} ${client.clientEmail ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8)
    .map((client) => ({
      id: client.userId,
      label: client.clientName,
      detail: client.clientEmail ?? "Cliente",
      href: `/broker/clients/${client.userId}`,
    }));

  const leads = workspace.leads
    .filter((lead) => {
      const hay = `${lead.clientName} ${lead.requestType} ${lead.status}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8)
    .map((lead) => ({
      id: lead.id,
      label: lead.clientName,
      detail: lead.requestType,
      href: `/broker/requests/${lead.id}`,
    }));

  const contracts = workspace.contracts
    .filter((contract) => {
      const hay = `${contract.insurer} ${contract.product} ${contract.category}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8)
    .map((contract) => ({
      id: String(contract.id),
      label: `${contract.insurer} · ${contract.product}`,
      detail: String(contract.category ?? ""),
      href: contract.consultation_request_id
        ? `/broker/requests/${contract.consultation_request_id}`
        : "/broker/contracts",
    }));

  const offers = workspace.offers
    .filter((offer) => {
      const hay = `${offer.insurer} ${offer.product} ${offer.clientName ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8)
    .map((offer) => ({
      id: String(offer.id),
      label: `${offer.insurer} · ${offer.product}`,
      detail: offer.clientName ?? String(offer.status),
      href: `/broker/requests/${offer.consultation_request_id}`,
    }));

  return { clients, leads, contracts, offers };
}

export async function getBrokerCommissionLedger() {
  const { supabase } = await requireOperationsRole(["broker"]);
  const { data, error } = await supabase.rpc("get_broker_commission_ledger");
  if (error) throw new Error("Ledger commissioni non disponibile.");
  return data ?? [];
}
