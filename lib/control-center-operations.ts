import "server-only";

import { requireOperationsRole } from "@/lib/operations-access";
import { periodBounds, type AnalyticsPeriod, safeNumber } from "@/lib/analytics-period";
import { getAdminWorkspace } from "@/lib/admin-operations";
import { getCantonAggregates, listPartnerApplicationsForAdmin } from "@/lib/partner-applications";

export async function getControlCenterDashboard(period: AnalyticsPeriod = "30d") {
  const { supabase } = await requireOperationsRole(["admin"]);
  const bounds = periodBounds(period);
  const fromIso = bounds.from?.toISOString() ?? null;
  const toIso = bounds.to.toISOString();

  // Always load the proven admin workspace first so Control Center remains usable
  // even when the onboarding/analytics migration is not yet applied.
  const workspace = await getAdminWorkspace();

  const [summarySettled, funnelSettled, growthSettled, cantonsSettled, applicationsSettled] =
    await Promise.allSettled([
      supabase.rpc("get_control_center_summary", {
        p_from: fromIso,
        p_to: toIso,
      }),
      supabase.rpc("get_platform_engagement_funnel"),
      supabase.rpc("get_platform_growth_series", { p_months: 12 }),
      getCantonAggregates("admin"),
      listPartnerApplicationsForAdmin(),
    ]);

  const summaryResult =
    summarySettled.status === "fulfilled" ? summarySettled.value : { data: null, error: true };
  const funnelResult =
    funnelSettled.status === "fulfilled" ? funnelSettled.value : { data: null, error: true };
  const growthResult =
    growthSettled.status === "fulfilled" ? growthSettled.value : { data: null, error: true };
  const cantons = cantonsSettled.status === "fulfilled" ? cantonsSettled.value : [];
  const applications =
    applicationsSettled.status === "fulfilled" ? applicationsSettled.value : [];

  const summary = (!("error" in summaryResult && summaryResult.error) && summaryResult.data
    ? summaryResult.data
    : null) as Record<string, unknown> | null;
  const revenue = ((summary?.revenue ?? {}) as Record<string, unknown>) ?? {};
  const legacy = workspace.summary;

  return {
    period: bounds,
    summary: {
      users: safeNumber(summary?.users),
      usersTotal: safeNumber(summary?.users_total),
      partners: safeNumber(summary?.partners),
      partnersActive: safeNumber(
        summary?.partners_active ?? workspace.brokers.filter((b) => b.active).length
      ),
      applicationsPending: safeNumber(summary?.applications_pending),
      policies: safeNumber(summary?.policies),
      policiesTotal: safeNumber(summary?.policies_total),
      documents: safeNumber(summary?.documents),
      documentsFailed: safeNumber(summary?.documents_failed),
      documentsProcessing: safeNumber(summary?.documents_processing),
      consultations: safeNumber(summary?.consultations ?? workspace.requests.length),
      appointments: safeNumber(summary?.appointments),
      offers: safeNumber(summary?.offers),
      contracts: safeNumber(summary?.contracts ?? legacy.contractsCount),
      clawbacks: safeNumber(summary?.clawbacks ?? legacy.clawbacks),
      gross: safeNumber(revenue.gross ?? legacy.grossCommission),
      atlas: safeNumber(revenue.atlas ?? legacy.atlasRevenue),
      broker: safeNumber(revenue.broker ?? legacy.brokerRevenue),
      expected: safeNumber(revenue.expected ?? legacy.expectedCommission),
      paid: safeNumber(revenue.paid ?? legacy.paidCommission),
    },
    funnel: !funnelResult.error && Array.isArray(funnelResult.data)
      ? (funnelResult.data as Array<{ id: string; label: string; count: number }>)
      : [
          { id: "consultations", label: "Richieste consulenza", count: workspace.requests.length },
          { id: "contracts", label: "Con contratto", count: legacy.contractsCount },
        ],
    growth:
      !growthResult.error && Array.isArray(growthResult.data)
        ? (growthResult.data as Array<{
            month: string;
            new_users: number;
            cumulative_users: number;
          }>)
        : [],
    workspace,
    cantons,
    applications,
  };
}

export async function getAdminUserDirectory(search?: string, role?: string) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { data, error } = await supabase.rpc("get_admin_user_directory");
  if (error) {
    // Fallback before migration: profiles + roles only.
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleByUser = new Map((roles ?? []).map((r) => [String(r.user_id), String(r.role)]));
    let rows = (profiles ?? []).map((p) => ({
      user_id: String(p.id),
      full_name: p.full_name as string | null,
      email: p.email as string | null,
      role: roleByUser.get(String(p.id)) ?? "consumer",
      created_at: String(p.created_at),
      policies_count: 0,
      documents_count: 0,
      consultations_count: 0,
      primary_canton: null as string | null,
    }));
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (row) =>
          (row.full_name ?? "").toLowerCase().includes(q) ||
          (row.email ?? "").toLowerCase().includes(q)
      );
    }
    if (role && role !== "all") {
      rows = rows.filter((row) => row.role === role);
    }
    return rows;
  }
  let rows = (data ?? []) as Array<{
    user_id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    created_at: string;
    policies_count: number;
    documents_count: number;
    consultations_count: number;
    primary_canton: string | null;
  }>;
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        (row.full_name ?? "").toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q)
    );
  }
  if (role && role !== "all") {
    rows = rows.filter((row) => row.role === role);
  }
  return rows;
}

export async function getAdminUserDetail(userId: string) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const [
    profileResult,
    roleResult,
    policiesResult,
    documentsResult,
    opportunitiesResult,
    consultationsResult,
    contractsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase
      .from("policies")
      .select("id, provider, policy_type, premium_amount, renewal_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("documents")
      .select("id, file_name, document_type, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("opportunities")
      .select("id, title, status, category, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("consultation_requests")
      .select(
        "id, status, request_type, assigned_broker_id, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("broker_contracts")
      .select("id, insurer, product, category, status, broker_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (profileResult.error || !profileResult.data) return null;

  return {
    profile: profileResult.data,
    role: roleResult.data?.role ?? "consumer",
    policies: policiesResult.data ?? [],
    documents: documentsResult.data ?? [],
    opportunities: opportunitiesResult.data ?? [],
    consultations: consultationsResult.data ?? [],
    contracts: contractsResult.data ?? [],
  };
}

export async function getPlatformAuditLog(limit = 200) {
  const { supabase } = await requireOperationsRole(["admin"]);
  const { data, error } = await supabase
    .from("platform_audit_log")
    .select("id, event_type, actor_id, actor_role, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (error.code === "42P01" || /platform_audit_log/i.test(error.message)) {
      return [];
    }
    throw new Error("Audit log non disponibile.");
  }
  return data ?? [];
}

export async function getPartnerPerformanceRows() {
  const { supabase } = await requireOperationsRole(["admin"]);
  const [{ data: brokers, error: brokersError }, { data: commissions, error: commissionsError }, { data: contracts, error: contractsError }, { data: requests, error: requestsError }] =
    await Promise.all([
      supabase.rpc("get_admin_brokers"),
      supabase
        .from("commission_attributions")
        .select("broker_id, gross_commission, atlas_share, broker_share, status"),
      supabase.from("broker_contracts").select("broker_id, id, status"),
      supabase.from("consultation_requests").select("assigned_broker_id, status"),
    ]);
  if (brokersError || commissionsError || contractsError || requestsError) {
    throw new Error("Performance partner non disponibili.");
  }

  return ((brokers ?? []) as Array<{
    id: string;
    display_name: string;
    active: boolean;
    email: string | null;
  }>).map((broker) => {
    const brokerCommissions = (commissions ?? []).filter(
      (row) => row.broker_id === broker.id && !["cancelled", "reversed"].includes(String(row.status))
    );
    const brokerContracts = (contracts ?? []).filter((row) => row.broker_id === broker.id);
    const brokerLeads = (requests ?? []).filter(
      (row) => row.assigned_broker_id === broker.id
    );
    const won = brokerLeads.filter((row) =>
      ["won", "completed"].includes(String(row.status))
    ).length;
    const decided = brokerLeads.filter((row) =>
      ["won", "completed", "lost"].includes(String(row.status))
    ).length;
    const gross = brokerCommissions.reduce(
      (sum, row) => sum + Number(row.gross_commission ?? 0),
      0
    );
    const atlas = brokerCommissions.reduce(
      (sum, row) => sum + Number(row.atlas_share ?? 0),
      0
    );
    const brokerShare = brokerCommissions.reduce(
      (sum, row) => sum + Number(row.broker_share ?? 0),
      0
    );
    return {
      id: broker.id,
      name: broker.display_name,
      active: broker.active,
      email: broker.email,
      leads: brokerLeads.length,
      contracts: brokerContracts.length,
      conversion: decided ? Math.round((won / decided) * 1000) / 10 : 0,
      gross,
      atlas,
      brokerShare,
      avgRevenuePerClient:
        brokerLeads.length > 0
          ? Math.round((brokerShare / new Set(brokerLeads.map((l) => l.assigned_broker_id)).size) * 100) / 100
          : brokerShare,
    };
  });
}
