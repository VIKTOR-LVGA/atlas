import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, PencilLine, Sparkles } from "lucide-react";
import { PolicyConfirmReviewButton } from "@/components/policies/PolicyConfirmReviewButton";
import { PolicyConfidenceRing } from "@/components/policies/PolicyConfidenceRing";
import { LinkAction } from "@/components/ui/LinkAction";
import { SectionCard } from "@/components/ui/SectionCard";
import type { PolicyReviewCenterItem } from "@/lib/policy-detail-display";
import {
  getExtractionConfidenceDescription,
  getExtractionConfidenceLabel,
  getExtractionConfidenceTier,
} from "@/lib/policy-extraction-reveal";
import { cn } from "@/lib/utils";

interface PolicyReviewCenterProps {
  policyId: string;
  requiresReview: boolean;
  extractionConfidence: number | null;
  uncertainFieldCount: number;
  items: PolicyReviewCenterItem[];
}

const toneStyles: Record<
  PolicyReviewCenterItem["tone"],
  { icon: typeof AlertTriangle; className: string }
> = {
  attention: {
    icon: AlertTriangle,
    className: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  },
  neutral: {
    icon: Sparkles,
    className: "bg-card-muted text-muted-foreground",
  },
  success: {
    icon: CheckCircle2,
    className: "bg-[var(--success-bg)] text-[var(--success-text)]",
  },
};

export function PolicyReviewCenter({
  policyId,
  requiresReview,
  extractionConfidence,
  uncertainFieldCount,
  items,
}: PolicyReviewCenterProps) {
  const confidenceTier = getExtractionConfidenceTier(extractionConfidence);
  const confidenceLabel = getExtractionConfidenceLabel(confidenceTier);

  return (
    <SectionCard
      title="Centro revisione"
      description="Verifica guidata dei dati estratti"
      padding="sm"
      bodyClassName="space-y-3"
    >
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-card-muted/50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Qualità estrazione
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-foreground">
            {confidenceLabel}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {getExtractionConfidenceDescription(
              confidenceTier,
              extractionConfidence
            )}
          </p>
          {requiresReview ? (
            <p className="mt-1 text-[10px] font-medium text-[var(--warning-text)]">
              Revisione richiesta
            </p>
          ) : null}
        </div>
        <PolicyConfidenceRing confidence={extractionConfidence} size="md" />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const tone = toneStyles[item.tone];
          const Icon = tone.icon;

          return (
            <li
              key={item.id}
              className="atlas-row-interactive flex gap-2.5 rounded-lg border border-border-subtle px-2.5 py-2"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  tone.className
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-border-subtle pt-3">
        {requiresReview ? (
          <>
            <Link
              href={`/policies/${policyId}/edit`}
              className="atlas-btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-[13px] shadow-sm"
            >
              <PencilLine className="h-4 w-4" />
              Rivedi bozza
            </Link>
            <div className="w-full [&_form]:w-full [&_button]:w-full">
              <PolicyConfirmReviewButton policyId={policyId} />
            </div>
          </>
        ) : (
          <Link
            href={`/policies/${policyId}/edit`}
            className="atlas-btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-[13px]"
          >
            <ClipboardCheck className="h-4 w-4" />
            Apri editor
          </Link>
        )}
        {uncertainFieldCount > 0 ? (
          <p className="text-center text-[10px] text-muted">
            {uncertainFieldCount} campi con confidenza bassa nel dettaglio tecnico.
          </p>
        ) : null}
        <div className="flex justify-center">
          <LinkAction href={`/policies/${policyId}/edit`}>Vai alla revisione completa</LinkAction>
        </div>
      </div>
    </SectionCard>
  );
}
