import { redirect } from "next/navigation";
import { getOperationsIdentity } from "@/lib/operations-access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fcontrol-center");
  if (identity.role !== "admin") {
    if (identity.role === "broker") redirect("/partner/dashboard");
    redirect("/dashboard");
  }
  return children;
}
