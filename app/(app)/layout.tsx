import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { isBrokerPortalEnabled } from "@/lib/broker-portal-flags";
import { getCurrentProfile } from "@/lib/profiles";
import { getOperationsIdentity } from "@/lib/operations-access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, identity] = await Promise.all([getCurrentProfile(), getOperationsIdentity()]);

  if (!profile) {
    redirect("/login");
  }

  // Keep DB role=broker unchanged. Portal ON → workspace. Portal OFF → dedicated pause page
  // (do not silently treat brokers as consumers).
  if (identity.role === "broker") {
    if (isBrokerPortalEnabled()) redirect("/broker/dashboard");
    redirect("/broker-unavailable");
  }

  return (
    <AppShell profile={{ ...profile, role: identity.role }}>{children}</AppShell>
  );
}
