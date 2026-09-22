import { PartnerShell } from "@/components/partner/PartnerShell";
import { getOperationsIdentity } from "@/lib/operations-access";
import { redirect } from "next/navigation";

export default async function BrokerWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fbroker%2Fdashboard");
  if (identity.role !== "broker" || !identity.broker) {
    const applicationPending = identity.role === "consumer";
    redirect(applicationPending ? "/partner/status" : "/dashboard");
  }

  let newRequests = 0;
  try {
    const { count } = await identity.supabase
      .from("consultation_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_broker_id", identity.broker.id)
      .in("status", ["assigned", "submitted"]);
    newRequests = count ?? 0;
  } catch {
    newRequests = 0;
  }

  const nav = [
    { href: "/broker/dashboard", label: "Dashboard", icon: "dashboard" as const },
    {
      href: "/broker/requests",
      label: "Richieste ATLAS",
      icon: "pipeline" as const,
      badge: newRequests,
    },
    {
      href: "/broker/clients",
      label: "Clienti ATLAS",
      icon: "clients" as const,
    },
    {
      href: "/broker/appointments",
      label: "Appuntamenti",
      icon: "appointments" as const,
    },
    { href: "/broker/offers", label: "Offerte", icon: "offers" as const },
    { href: "/broker/contracts", label: "Contratti", icon: "contracts" as const },
    {
      href: "/broker/commissions",
      label: "Commissioni",
      icon: "revenue" as const,
    },
    { href: "/broker/analytics", label: "Analytics", icon: "analytics" as const },
    { href: "/broker/profile", label: "Profilo", icon: "profile" as const },
  ];

  return (
    <PartnerShell
      brandLabel="Broker Workspace"
      subtitle={`${identity.broker.displayName} · richieste ATLAS assegnate`}
      nav={nav}
    >
      {children}
    </PartnerShell>
  );
}
