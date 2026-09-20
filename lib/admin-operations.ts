import "server-only";

import { requireOperationsRole } from "@/lib/operations-access";

const numberValue = (value: unknown) => Number(value ?? 0);

type AdminBrokerRow = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  legal_name: string | null;
  organization_name: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
};

export async function getAdminWorkspace() {
  const { supabase } = await requireOperationsRole(["admin"]);
  const [summaryResult, requestsResult, brokersResult, contractsResult, commissionsResult] = await Promise.all([
    supabase.rpc("get_admin_revenue_summary"),
    supabase.from("consultation_requests").select("id, user_id, assigned_broker_id, status, request_type, source, created_at, updated_at").order("updated_at", { ascending: false }).limit(100),
    supabase.rpc("get_admin_brokers"),
    supabase.from("broker_contracts").select("id, user_id, broker_id, insurer, product, category, status, contract_start_date, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("commission_attributions").select("id, consultation_request_id, broker_id, insurer, product, category, commission_type, currency, gross_commission, atlas_share, broker_share, status, earned_at, paid_at, created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [summaryResult, requestsResult, brokersResult, contractsResult, commissionsResult]) {
    if (result.error) throw new Error("Dati amministrativi non disponibili.");
  }
  const requests = requestsResult.data ?? [];
  const userIds = [...new Set(requests.map((row) => String(row.user_id)))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [], error: null };
  if (profileError) throw new Error("Dati amministrativi non disponibili.");
  const profileById = new Map((profiles ?? []).map((row) => [String(row.id), row]));
  const raw = (summaryResult.data?.[0] ?? {}) as Record<string, unknown>;
  return {
    summary: {
      grossCommission: numberValue(raw.gross_commission),
      atlasRevenue: numberValue(raw.atlas_revenue),
      brokerRevenue: numberValue(raw.broker_revenue),
      expectedCommission: numberValue(raw.expected_commission),
      paidCommission: numberValue(raw.paid_commission),
      clawbacks: numberValue(raw.clawbacks),
      netCommission: numberValue(raw.net_commission),
      contractsCount: numberValue(raw.contracts_count),
      wonClients: numberValue(raw.won_clients),
    },
    requests: requests.map((request) => ({
      ...request,
      clientName: String(profileById.get(String(request.user_id))?.full_name ?? "Cliente ATLAS"),
    })),
    brokers: (brokersResult.data ?? []) as AdminBrokerRow[],
    contracts: contractsResult.data ?? [],
    commissions: commissionsResult.data ?? [],
  };
}
