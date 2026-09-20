import { redirect } from "next/navigation";

export default async function BrokerLeadDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/partner/leads/${id}`);
}
