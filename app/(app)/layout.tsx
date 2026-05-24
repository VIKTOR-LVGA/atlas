import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/lib/profiles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
