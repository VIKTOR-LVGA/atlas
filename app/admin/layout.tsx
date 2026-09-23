import { redirect } from "next/navigation";
import { isBrokerPortalEnabled } from "@/lib/broker-portal-flags";
import { getOperationsIdentity } from "@/lib/operations-access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fcontrol-center");
  if (identity.role !== "admin") {
    if (identity.role === "broker" && isBrokerPortalEnabled()) {
      redirect("/broker/dashboard");
    }
    redirect("/dashboard");
  }
  return children;
}
