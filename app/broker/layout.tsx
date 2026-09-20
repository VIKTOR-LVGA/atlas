import { redirect } from "next/navigation";
import { getOperationsIdentity } from "@/lib/operations-access";

/** Legacy /broker/* keeps bookmarks working via page-level redirects to /partner/*. */
export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fpartner%2Fdashboard");
  if (identity.role !== "broker" || !identity.broker) redirect("/dashboard");
  return children;
}
