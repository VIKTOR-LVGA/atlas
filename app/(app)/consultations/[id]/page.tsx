import { notFound } from "next/navigation";
import {
  CollaborationError,
  getConsumerConsultationDetail,
} from "@/lib/consumer-collaboration";
import { ConsumerConsultationDetail } from "./ConsultationClient";

export default async function ConsumerConsultationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  let data;
  try {
    data = await getConsumerConsultationDetail(id);
  } catch (error) {
    if (error instanceof CollaborationError) notFound();
    throw error;
  }
  return (
    <ConsumerConsultationDetail
      consultationId={id}
      initialTab={tab}
      data={data}
    />
  );
}
