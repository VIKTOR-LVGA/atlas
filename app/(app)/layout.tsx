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

  if (identity.role === "broker") redirect("/broker");
  if (identity.role === "admin") redirect("/admin");

  return <AppShell profile={profile}>{children}</AppShell>;
}
