import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import {
  getPolicyDetailSummary,
  getPolicyReviewStatusBadge,
  getPolicyTypeLabel,
} from "@/lib/policy-types";
import { formatCHF, formatDate } from "@/lib/utils";
import type { PolicyPremiumFrequency, UserPolicy } from "@/lib/types";
import { cn } from "@/lib/utils";

const premiumFrequencyLabels: Record<PolicyPremiumFrequency, string> = {
  monthly: "mensile",
  quarterly: "trimestrale",
  semiannual: "semestrale",
  annual: "annuale",
};

export function PolicyListCard({ policy }: { policy: UserPolicy }) {
  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const detailSummary = getPolicyDetailSummary(policy.policyType, policy.details);
  const reviewStatus = getPolicyReviewStatusBadge(policy);
  const insuredCount = policy.details.insured_people?.length ?? 0;
  const coverageCount = policy.details.coverages?.length ?? 0;

  return (
    <article className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            typedPolicyIconStyles[policy.policyType]
          )}
        >
          <TypedPolicyIcon policyType={policy.policyType} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/policies/${policy.id}`} className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-900 group-hover:text-blue-700">
                {policy.provider}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-slate-500">
                {policyTypeLabel}
              </p>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge variant={reviewStatus.variant} label={reviewStatus.label} />
              {policy.source === "ai_draft" &&
              policy.requiresReview &&
              policy.extractionConfidence !== null ? (
                <ConfidenceBadge confidence={policy.extractionConfidence} />
              ) : null}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                Premio
              </dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {policy.premiumAmount === null
                  ? "Da completare"
                  : `${formatCHF(policy.premiumAmount)} / ${premiumFrequencyLabels[policy.premiumFrequency]}`}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                Rinnovo
              </dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {policy.renewalDate ? formatDate(policy.renewalDate) : "—"}
              </dd>
            </div>
          </dl>

          {(insuredCount > 0 || coverageCount > 0 || detailSummary) && (
            <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
              {[
                insuredCount > 0 ? `${insuredCount} persone` : null,
                coverageCount > 0 ? `${coverageCount} coperture` : null,
                detailSummary || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3">
            {policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="inline-flex min-w-0 max-w-[55%] items-center gap-1.5 text-[11px] font-medium text-blue-700 hover:text-blue-800"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{policy.document.fileName}</span>
              </Link>
            ) : (
              <span className="text-[11px] text-slate-400">Nessun PDF</span>
            )}
            <Link
              href={`/policies/${policy.id}`}
              className="inline-flex items-center gap-0.5 text-[12px] font-medium text-slate-700 hover:text-blue-700"
            >
              Dettaglio
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
