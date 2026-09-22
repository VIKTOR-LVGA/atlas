import "server-only";

import { requireOperationsRole } from "@/lib/operations-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  classifyInsuranceDocument,
  detectInsuranceDocumentLanguage,
  recognizeSwissInsurer,
} from "@/lib/insurance-knowledge";
import { extractReadableTextFromPdf } from "@/lib/pdf-text";
import {
  extractQuoteStructureFromText,
  OpenAIPolicyExtractionError,
} from "@/lib/openai-policy-extraction";
import type { UserDocument } from "@/lib/types";

export class OfferQuoteAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfferQuoteAnalysisError";
  }
}

const POLICY_DOCUMENTS_BUCKET = "policy-documents";

function toUserDocument(row: Record<string, unknown>): UserDocument {
  return {
    id: String(row.id),
    fileName: String(row.file_name),
    filePath: String(row.file_path),
    fileSize: Number(row.file_size ?? 0),
    mimeType: String(row.mime_type ?? "application/pdf"),
    status: (row.status as UserDocument["status"]) ?? "uploaded",
    analysisError: row.analysis_error ? String(row.analysis_error) : null,
    documentType: (row.document_type as UserDocument["documentType"]) ?? "unknown",
    documentLanguage: (row.document_language as UserDocument["documentLanguage"]) ?? null,
    recognizedInsurer: row.recognized_insurer ? String(row.recognized_insurer) : null,
    classificationConfidence:
      row.classification_confidence != null ? Number(row.classification_confidence) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function downloadOfferDocumentBytes(filePath: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(POLICY_DOCUMENTS_BUCKET)
    .download(filePath);
  if (error || !data) {
    throw new OfferQuoteAnalysisError("Impossibile leggere il PDF del preventivo.");
  }
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Analyze a quote/offer PDF attached to a draft insurance_offer.
 * Reuses Insurance Intelligence extraction; never creates a personal policy.
 */
export async function analyzeBrokerOfferQuote(offerId: string) {
  const { supabase, broker, user } = await requireOperationsRole(["broker"]);
  if (!broker || !user) throw new OfferQuoteAnalysisError("Profilo broker mancante.");

  const { data: offer, error: offerError } = await supabase
    .from("insurance_offers")
    .select(
      "id, consultation_request_id, broker_id, status, quote_document_id, source_policy_id, version"
    )
    .eq("id", offerId)
    .eq("broker_id", broker.id)
    .maybeSingle();
  if (offerError || !offer) throw new OfferQuoteAnalysisError("Offerta non trovata.");
  if (offer.status !== "draft") {
    throw new OfferQuoteAnalysisError("Analisi consentita solo sulle bozze (crea una revisione).");
  }
  if (!offer.quote_document_id) {
    throw new OfferQuoteAnalysisError("Carica prima un PDF preventivo.");
  }

  await supabase
    .from("insurance_offers")
    .update({ extraction_status: "analyzing", extraction_error: null })
    .eq("id", offer.id);

  const { data: docRow, error: docError } = await supabase
    .from("documents")
    .select(
      "id, file_name, file_path, file_size, mime_type, status, analysis_error, file_hash, document_type, document_language, recognized_insurer, classification_confidence, created_at, updated_at"
    )
    .eq("id", offer.quote_document_id)
    .maybeSingle();
  if (docError || !docRow) {
    await supabase
      .from("insurance_offers")
      .update({
        extraction_status: "failed",
        extraction_error: "Documento non trovato",
      })
      .eq("id", offer.id);
    throw new OfferQuoteAnalysisError("Documento preventivo non trovato.");
  }

  const document = toUserDocument(docRow);

  try {
    const pdf = await downloadOfferDocumentBytes(document.filePath);
    const text = await extractReadableTextFromPdf(pdf);
    const classification = classifyInsuranceDocument(text);
    const insurer = recognizeSwissInsurer(text);
    const language = detectInsuranceDocumentLanguage(text);

    const mappedType =
      classification.type === "quote" || classification.type === "offer"
        ? classification.type
        : "quote";

    await supabase
      .from("documents")
      .update({
        document_type: mappedType,
        document_language: language,
        recognized_insurer: insurer.brand,
        classification_confidence: classification.confidence,
        classification_metadata: {
          evidence: classification.evidence,
          quote_pipeline: true,
          original_classification: classification.type,
        },
        status: "analyzed",
      })
      .eq("id", document.id);

    let draft = null as Awaited<
      ReturnType<typeof extractQuoteStructureFromText>
    >["draft"] | null;
    let extractionPartial = false;
    try {
      const result = await extractQuoteStructureFromText(document, text);
      draft = result.draft;
    } catch (error) {
      extractionPartial = true;
      if (!(error instanceof OpenAIPolicyExtractionError)) {
        // keep going with classification-only fields
        console.error("quote extraction failed", error);
      }
    }

    const premium =
      draft?.premiumAmount != null && Number.isFinite(Number(draft.premiumAmount))
        ? Number(draft.premiumAmount)
        : null;

    await supabase
      .from("insurance_offers")
      .update({
        extraction_status: "needs_review",
        extraction_error: extractionPartial || !draft
          ? "Non siamo riusciti a leggere tutto il preventivo. Completa i dati manualmente."
          : null,
        insurer: draft?.provider || insurer.brand || "Da verificare",
        product: draft?.policyCategoryLabel || draft?.policyType || "Preventivo",
        policy_category: draft?.policyType || "other",
        premium_amount: premium,
        premium_frequency: draft?.premiumFrequency || "annual",
        currency: draft?.currency || "CHF",
        effective_date: draft?.startDate || null,
        metadata: {
          extraction: {
            confidence: draft?.extractionConfidence ?? null,
            notes: draft?.extractionNotes ?? null,
            classification: mappedType,
            original_classification: classification.type,
          },
          deductible: draft?.deductible ?? null,
        },
      })
      .eq("id", offer.id);

    const details = draft?.details as
      | {
          coverages?: Array<{
            code?: string;
            label?: string;
            deductible?: number | null;
          }>;
        }
      | undefined;
    const coverages = details?.coverages ?? [];
    await supabase.from("insurance_offer_items").delete().eq("offer_id", offer.id);
    if (coverages.length) {
      await supabase.from("insurance_offer_items").insert(
        coverages.slice(0, 80).map((c) => ({
          offer_id: offer.id,
          item_kind: "coverage" as const,
          code: c.code ?? null,
          label: (c.label || c.code || "Copertura").slice(0, 240),
          value_numeric: c.deductible != null ? Number(c.deductible) : null,
          currency: "CHF",
        }))
      );
    }
    if (draft?.deductible != null) {
      await supabase.from("insurance_offer_items").insert({
        offer_id: offer.id,
        item_kind: "deductible",
        label: "Franchigia",
        value_numeric: Number(draft.deductible),
        currency: "CHF",
      });
    }

    return { offerId: offer.id, extractionStatus: "needs_review" as const };
  } catch (error) {
    const message =
      error instanceof OfferQuoteAnalysisError
        ? error.message
        : "Non siamo riusciti a leggere tutto il preventivo. Completa i dati manualmente.";
    await supabase
      .from("insurance_offers")
      .update({ extraction_status: "failed", extraction_error: message.slice(0, 500) })
      .eq("id", offer.id);
    // Still allow manual completion
    return { offerId: offer.id, extractionStatus: "failed" as const, message };
  }
}

export async function verifyBrokerOfferExtraction(input: {
  offerId: string;
  insurer: string;
  product: string;
  category: string;
  premiumAmount: number | null;
  premiumFrequency: string | null;
  currency?: string;
  effectiveDate?: string | null;
  quoteValidityDate?: string | null;
  sourcePolicyId: string;
  consumerNotes?: string | null;
}) {
  const { supabase, broker, user } = await requireOperationsRole(["broker"]);
  if (!broker || !user) throw new OfferQuoteAnalysisError("Profilo broker mancante.");

  const { data: offer } = await supabase
    .from("insurance_offers")
    .select("id, status")
    .eq("id", input.offerId)
    .eq("broker_id", broker.id)
    .maybeSingle();
  if (!offer) throw new OfferQuoteAnalysisError("Offerta non trovata.");
  if (offer.status !== "draft") {
    throw new OfferQuoteAnalysisError("Verifica consentita solo in bozza.");
  }
  if (!input.sourcePolicyId) {
    throw new OfferQuoteAnalysisError("Seleziona la polizza attuale da confrontare.");
  }
  if (!input.insurer.trim() || !input.product.trim()) {
    throw new OfferQuoteAnalysisError("Compagnia e prodotto sono obbligatori.");
  }

  const { error } = await supabase
    .from("insurance_offers")
    .update({
      insurer: input.insurer.slice(0, 120),
      product: input.product.slice(0, 120),
      policy_category: input.category.slice(0, 80),
      premium_amount: input.premiumAmount,
      premium_frequency: input.premiumFrequency || "annual",
      currency: input.currency || "CHF",
      effective_date: input.effectiveDate || null,
      quote_validity_date: input.quoteValidityDate || null,
      source_policy_id: input.sourcePolicyId,
      consumer_visible_notes: input.consumerNotes?.slice(0, 2000) || null,
      extraction_status: "ready_to_send",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", offer.id);
  if (error) throw new OfferQuoteAnalysisError(error.message);

  return { offerId: offer.id };
}

export async function createSignedOfferQuoteUrl(documentId: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await supabase
    .from("documents")
    .select("id, file_path, file_name")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return null;

  const { data, error } = await supabase.storage
    .from(POLICY_DOCUMENTS_BUCKET)
    .createSignedUrl(doc.file_path, 60 * 10, { download: doc.file_name });
  if (error || !data) return null;
  return data.signedUrl;
}
