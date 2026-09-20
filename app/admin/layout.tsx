import { redirect } from "next/navigation";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { getOperationsIdentity } from "@/lib/operations-access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fadmin");
  if (identity.role !== "admin") redirect("/dashboard");
  return <OperationsShell title="Admin Control" subtitle="Governance globale, assegnazioni e revenue ATLAS" nav={[
    { href: "/admin", label: "Controllo", icon: "admin" },
    { href: "/admin#requests", label: "Richieste", icon: "pipeline" },
    { href: "/admin#brokers", label: "Broker", icon: "clients" },
    { href: "/admin#revenue", label: "Revenue", icon: "revenue" },
  ]}>{children}</OperationsShell>;
}
