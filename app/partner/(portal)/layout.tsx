import { PartnerShell } from "@/components/partner/PartnerShell";
import { getOperationsIdentity } from "@/lib/operations-access";
import { redirect } from "next/navigation";

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fpartner%2Fdashboard");
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
    { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" as const },
    {
      href: "/partner/leads",
      label: "Richieste",
      icon: "pipeline" as const,
      badge: newRequests,
    },
    { href: "/partner/clients", label: "Clienti", icon: "clients" as const },
    {
      href: "/partner/appointments",
      label: "Appuntamenti",
      icon: "appointments" as const,
    },
    { href: "/partner/offers", label: "Offerte", icon: "offers" as const },
    { href: "/partner/contracts", label: "Contratti", icon: "contracts" as const },
    { href: "/partner/commissions", label: "Commissioni", icon: "revenue" as const },
    { href: "/partner/analytics", label: "Analytics", icon: "analytics" as const },
    { href: "/partner/profile", label: "Profilo", icon: "profile" as const },
  ];

  return (
    <PartnerShell
      subtitle={`${identity.broker.displayName} · solo mandati assegnati`}
      nav={nav}
    >
      {children}
    </PartnerShell>
  );
}
