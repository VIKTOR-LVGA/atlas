import { redirect } from "next/navigation";
import { OperationsShell } from "@/components/operations/OperationsShell";
import { getOperationsIdentity } from "@/lib/operations-access";

export default async function BrokerLayout({ children }: { children: React.ReactNode }) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fbroker");
  if (identity.role !== "broker" || !identity.broker) redirect("/dashboard");
  return <OperationsShell title="Broker Workspace" subtitle={`${identity.broker.displayName} · accesso limitato ai mandati assegnati`} nav={[
    { href: "/broker", label: "Pipeline", icon: "pipeline" },
    { href: "/broker/leads", label: "Lead", icon: "pipeline" },
    { href: "/broker/clients", label: "Clienti", icon: "clients" },
    { href: "/broker/commissions", label: "Commissioni", icon: "revenue" },
  ]}>{children}</OperationsShell>;
}
