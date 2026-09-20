import { redirect } from "next/navigation";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { getOperationsIdentity } from "@/lib/operations-access";

const nav = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/partner/leads", label: "Richieste", icon: "pipeline" as const },
  { href: "/partner/clients", label: "Clienti", icon: "clients" as const },
  { href: "/partner/appointments", label: "Appuntamenti", icon: "appointments" as const },
  { href: "/partner/offers", label: "Offerte", icon: "offers" as const },
  { href: "/partner/contracts", label: "Contratti", icon: "contracts" as const },
  { href: "/partner/commissions", label: "Commissioni", icon: "revenue" as const },
  { href: "/partner/analytics", label: "Analytics", icon: "analytics" as const },
  { href: "/partner/profile", label: "Profilo", icon: "profile" as const },
];

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

  return (
    <OperationsShell
      title="Partner Portal"
      subtitle={`${identity.broker.displayName} · solo mandati assegnati`}
      nav={nav}
    >
      {children}
    </OperationsShell>
  );
}
