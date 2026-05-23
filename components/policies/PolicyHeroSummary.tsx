import Link from "next/link";
import { PencilLine } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyTypeLabel } from "@/lib/policy-types";
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

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
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
              {policy.requiresReview ? (
                <StatusBadge variant="attention" label="Da rivedere" />
              ) : (
                <StatusBadge
                  variant={policy.status === "active" ? "active" : "neutral"}
                  label={policy.status === "active" ? "Attiva" : policy.status}
                />
              )}
              {policy.source === "ai_draft" ? (
                <StatusBadge variant="processing" label="Bozza AI" />
              ) : null}
            </div>
            <h1 className="mt-2 truncate text-[22px] font-semibold tracking-tight text-slate-900">
              {policy.provider}
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-500">{policyTypeLabel}</p>
            {policy.policyNumber ? (
              <p className="mt-1 text-[12px] text-slate-400">
                Polizza {policy.policyNumber}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Premio
            </p>
            <p className="mt-0.5 text-[20px] font-semibold text-slate-900">
              {policy.premiumAmount === null
                ? "Da completare"
                : formatCHF(policy.premiumAmount)}
            </p>
            {policy.premiumAmount !== null ? (
              <p className="text-[12px] text-slate-500">
                / {premiumFrequencyLabels[policy.premiumFrequency]}
              </p>
            ) : null}
          </div>
          {policy.extractionConfidence !== null ? (
            <ConfidenceBadge confidence={policy.extractionConfidence} />
          ) : null}
          {policy.requiresReview ? (
            <Link
              href={`/policies/${policy.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <PencilLine className="h-4 w-4" />
              Rivedi bozza
            </Link>
          ) : (
            <Link
              href={`/policies/${policy.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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
