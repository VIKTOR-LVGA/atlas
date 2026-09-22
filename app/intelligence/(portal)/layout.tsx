import { IntelligenceShell } from "@/components/intelligence/IntelligenceUi";
import { requireIntelligenceAccess } from "@/lib/intelligence-access";

export default async function IntelligencePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireIntelligenceAccess();
  return <IntelligenceShell>{children}</IntelligenceShell>;
}
