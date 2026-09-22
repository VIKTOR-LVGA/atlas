import { redirect } from "next/navigation";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { getOperationsIdentity } from "@/lib/operations-access";

const nav = [
  { href: "/control-center", label: "Dashboard", icon: "admin" as const },
  { href: "/control-center/users", label: "Utenti", icon: "clients" as const },
  { href: "/control-center/partners", label: "Broker", icon: "pipeline" as const },
  {
    href: "/control-center/intelligence",
    label: "Intelligence",
    icon: "analytics" as const,
  },
  {
    href: "/control-center/consultations",
    label: "Consulenze",
    icon: "appointments" as const,
  },
  { href: "/control-center/contracts", label: "Contratti", icon: "contracts" as const },
  { href: "/control-center/commissions", label: "Commissioni", icon: "revenue" as const },
  { href: "/control-center/analytics", label: "Analytics", icon: "analytics" as const },
  { href: "/control-center/health", label: "Health", icon: "admin" as const },
  { href: "/control-center/audit", label: "Audit", icon: "audit" as const },
  { href: "/control-center/profile", label: "Profilo", icon: "profile" as const },
];

export default async function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fcontrol-center");
  if (identity.role !== "admin") {
    if (identity.role === "broker") redirect("/broker/dashboard");
    redirect("/dashboard");
  }

  return (
    <OperationsShell
      title="Control Center"
      subtitle="Governance piattaforma · accesso admin server-side"
      nav={nav}
    >
      {children}
    </OperationsShell>
  );
}
