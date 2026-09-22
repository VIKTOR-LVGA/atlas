import { notFound } from "next/navigation";
import {
  CollaborationError,
  getConsumerOfferComparison,
} from "@/lib/consumer-collaboration";
import { OfferComparisonClient } from "./OfferClient";

export default async function ConsumerOfferPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>;
}) {
  const { id, offerId } = await params;
  let offer;
  let comparison;
  try {
    ({ offer, comparison } = await getConsumerOfferComparison(offerId));
  } catch (error) {
    if (error instanceof CollaborationError) notFound();
    throw error;
  }
  const pdfHref = offer.quote_document_id
    ? `/consultations/${id}/offers/${offerId}/pdf`
    : null;
  return (
    <OfferComparisonClient
      consultationId={id}
      offerId={offerId}
      offer={offer}
      comparison={comparison}
      pdfHref={pdfHref}
    />
  );
}
