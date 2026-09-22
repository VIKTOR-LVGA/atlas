import { notFound, redirect } from "next/navigation";
import { createSignedOfferQuoteUrl } from "@/lib/offer-quote-analysis";
import {
  CollaborationError,
  getConsumerOfferComparison,
} from "@/lib/consumer-collaboration";

export default async function OfferQuoteDownloadPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>;
}) {
  const { offerId } = await params;
  let quoteDocumentId: string | null = null;
  try {
    const { offer } = await getConsumerOfferComparison(offerId);
    quoteDocumentId = offer.quote_document_id ? String(offer.quote_document_id) : null;
  } catch (error) {
    if (error instanceof CollaborationError) notFound();
    throw error;
  }
  if (!quoteDocumentId) notFound();
  const url = await createSignedOfferQuoteUrl(quoteDocumentId);
  if (!url) notFound();
  redirect(url);
}
