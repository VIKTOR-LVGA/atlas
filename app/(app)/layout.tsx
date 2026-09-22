import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
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

  // Brokers stay in Broker Workspace. Admins may use the normal ATLAS account UX
  // with a discrete Control Center entry — authorization remains server-side.
  if (identity.role === "broker") redirect("/broker/dashboard");

  return (
    <AppShell profile={{ ...profile, role: identity.role }}>{children}</AppShell>
  );
}
