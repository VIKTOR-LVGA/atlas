import { redirect } from "next/navigation";

export default async function BrokerClientDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/partner/clients/${id}`);
}
