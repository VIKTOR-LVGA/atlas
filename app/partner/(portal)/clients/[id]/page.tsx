import { redirect } from "next/navigation";

export default async function LegacyClientRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/broker/clients/${id}`);
}
