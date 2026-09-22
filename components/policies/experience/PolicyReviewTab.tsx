import Link from "next/link";
import type { UserPolicy } from "@/lib/types";
import { PolicyFieldConfidenceTable } from "@/components/policies/PolicyFieldConfidenceTable";
import { PolicyExtractionMetadataPanel } from "@/components/policies/PolicyExtractionMetadataPanel";
import { PolicyReviewCenter } from "@/components/policies/detail/PolicyReviewCenter";
import { PolicyPartialExtractionBanner } from "@/components/policies/detail/PolicyPartialExtractionBanner";
import {
  getPolicyFieldConfidenceRows,
  getPolicyExtractionMetadata,
} from "@/lib/policy-types";
import {
  buildCoverageIntelligenceSummary,
  buildPolicyReviewCenterItems,
} from "@/lib/policy-detail-display";
import {
  countMissingKeyFields,
  isPartialExtraction,
} from "@/lib/policy-extraction-reveal";
import { getPolicyCoveragesForDisplay } from "@/lib/policy-health-grouping";

/**
 * Technical / verification mode — not the Consumer default.
 * Confidence percentages live only here.
 */
export function PolicyReviewTab({ policy }: { policy: UserPolicy }) {
  const fieldConfidenceRows = getPolicyFieldConfidenceRows(policy.details);
  const uncertainFields = fieldConfidenceRows.filter((row) => row.uncertain);
  const extractionMetadata = getPolicyExtractionMetadata(policy.details);
  const coveragesForDisplay = getPolicyCoveragesForDisplay(policy.details);
  const coverageSummary = buildCoverageIntelligenceSummary(
    null,
    coveragesForDisplay.length > 0 ? coveragesForDisplay : []
  );
  const reviewItems = buildPolicyReviewCenterItems({
    policy,
    uncertainFields,
    unassignedCount: 0,
    warnings: extractionMetadata.warnings ?? [],
    coverageSummary,
  });
  const missing = countMissingKeyFields(policy);
  const partial = isPartialExtraction({
    policy,
    uncertainFieldCount: uncertainFields.length,
    coverageSummary,
  });
  const completeness =
    policy.extractionConfidence != null
      ? Math.round(policy.extractionConfidence)
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Completezza dati estratti
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Questa percentuale misura quanto ATLAS ha potuto leggere dal PDF.{" "}
          <strong className="font-medium text-foreground">
            Non è una valutazione della qualità della polizza
          </strong>
          .
        </p>
        {completeness != null ? (
          <p className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
            {completeness}%
            <span className="ml-2 text-[12px] font-normal text-muted">
              completezza estrazione
            </span>
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Completezza non disponibile.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-lg border border-border px-2 py-1">
            {uncertainFields.length > 0
              ? `${uncertainFields.length} da controllare`
              : "Nessun campo incerto"}
          </span>
          <span className="rounded-lg border border-border px-2 py-1">
            {missing > 0 ? `${missing} campi chiave mancanti` : "Campi chiave ok"}
          </span>
        </div>
      </section>

      {partial ? (
        <PolicyPartialExtractionBanner
          policyId={policy.id}
          uncertainFieldCount={uncertainFields.length}
          unassignedCount={0}
          missingFieldCount={missing}
        />
      ) : null}

      <PolicyReviewCenter
        policyId={policy.id}
        requiresReview={policy.requiresReview}
        extractionConfidence={policy.extractionConfidence}
        uncertainFieldCount={uncertainFields.length}
        items={reviewItems}
      />

      {fieldConfidenceRows.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Confidenza per campo
          </h2>
          <PolicyFieldConfidenceTable rows={fieldConfidenceRows} />
        </section>
      ) : null}

      <PolicyExtractionMetadataPanel metadata={extractionMetadata} />

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/policies/${policy.id}/edit`}
          className="atlas-btn-secondary min-h-10 px-3 text-[12px]"
        >
          Modifica polizza
        </Link>
        {policy.documentId ? (
          <Link
            href={`/documents/${policy.documentId}`}
            className="atlas-btn-secondary min-h-10 px-3 text-[12px]"
          >
            Rianalizza da documento
          </Link>
        ) : null}
      </div>
    </div>
  );
}
