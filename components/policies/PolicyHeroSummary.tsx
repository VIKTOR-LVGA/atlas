import Link from "next/link";
import { PencilLine } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { PolicyConfirmReviewButton } from "@/components/policies/PolicyConfirmReviewButton";
import { getPolicyReviewStatusBadge, getPolicyTypeLabel } from "@/lib/policy-types";
import { formatCHF } from "@/lib/utils";
import type { PolicyPremiumFrequency, UserPolicy } from "@/lib/types";
import { cn } from "@/lib/utils";

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "mensile",
  quarterly: "trimestrale",
  semiannual: "semestrale",
  annual: "annuale",
};

interface PolicyHeroSummaryProps {
  policy: UserPolicy;
}

export function PolicyHeroSummary({ policy }: PolicyHeroSummaryProps) {
  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const reviewStatus = getPolicyReviewStatusBadge(policy);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              typedPolicyIconStyles[policy.policyType]
            )}
          >
            <TypedPolicyIcon policyType={policy.policyType} className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant={reviewStatus.variant} label={reviewStatus.label} />
              {policy.source === "ai_draft" && policy.requiresReview ? (
                <StatusBadge variant="processing" label="Bozza AI" />
              ) : null}
            </div>
            <h1 className="mt-2 truncate text-[22px] font-semibold tracking-tight text-foreground">
              {policy.provider}
            </h1>
            <p className="mt-0.5 text-[13px] text-muted">{policyTypeLabel}</p>
            {policy.policyNumber ? (
              <p className="mt-1 text-[12px] text-muted">
                Polizza {policy.policyNumber}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Premio
            </p>
            <p className="mt-0.5 text-[20px] font-semibold text-foreground">
              {policy.premiumAmount === null
                ? "Da completare"
                : formatCHF(policy.premiumAmount)}
            </p>
            {policy.premiumAmount !== null ? (
              <p className="text-[12px] text-muted">
                / {premiumFrequencyLabels[policy.premiumFrequency]}
              </p>
            ) : null}
          </div>
          {policy.extractionConfidence !== null ? (
            <ConfidenceBadge confidence={policy.extractionConfidence} />
          ) : null}
          {policy.requiresReview ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href={`/policies/${policy.id}/edit`}
                className="atlas-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-[13px] shadow-sm"
              >
                <PencilLine className="h-4 w-4" />
                Rivedi bozza
              </Link>
              <PolicyConfirmReviewButton policyId={policy.id} />
            </div>
          ) : (
            <Link
              href={`/policies/${policy.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-muted-foreground shadow-sm hover:bg-card-muted"
            >
              <PencilLine className="h-4 w-4" />
              Modifica
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
