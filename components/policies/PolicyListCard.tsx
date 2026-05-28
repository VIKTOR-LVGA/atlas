import Link from "next/link";
import { ChevronRight, FileText, Pencil } from "lucide-react";
import { PolicyConfidenceRing } from "@/components/policies/PolicyConfidenceRing";
import {
  formatRenewalRelative,
  getDaysUntilRenewal,
  getPolicyAnnualPremium,
  getPolicyCoverageCount,
  getPolicyDisplayStatus,
  getPolicyInsuredCount,
  getPolicyPremiumLabel,
} from "@/components/policies/policy-portfolio-display";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyDetailSummary, getPolicyTypeLabel } from "@/lib/policy-types";
import { formatCHF, formatDate } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PolicyListCardProps {
  policy: UserPolicy;
  compact?: boolean;
}

export function PolicyListCard({ policy, compact = false }: PolicyListCardProps) {
  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const detailSummary = getPolicyDetailSummary(policy.policyType, policy.details);
  const displayStatus = getPolicyDisplayStatus(policy);
  const insuredCount = getPolicyInsuredCount(policy);
  const coverageCount = getPolicyCoverageCount(policy);
  const annualPremium = getPolicyAnnualPremium(policy);
  const renewalDays = getDaysUntilRenewal(policy.renewalDate);
  const renewalRelative = formatRenewalRelative(renewalDays);

  return (
    <article
      className={cn(
        "atlas-surface-card-interactive group",
        compact ? "p-3" : "p-3.5"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[10px] ring-1 ring-black/5 dark:ring-white/5",
            compact ? "h-8 w-8" : "h-9 w-9",
            typedPolicyIconStyles[policy.policyType]
          )}
        >
          <TypedPolicyIcon
            policyType={policy.policyType}
            className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/policies/${policy.id}`} className="min-w-0">
              <p
                className={cn(
                  "truncate font-semibold text-foreground group-hover:text-accent",
                  compact ? "text-[12px]" : "text-[13px]"
                )}
              >
                {policy.provider || policyTypeLabel}
              </p>
              <p className="mt-px truncate text-[10px] text-muted-foreground">
                {policyTypeLabel}
                {policy.policyNumber ? ` · ${policy.policyNumber}` : ""}
              </p>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge variant={displayStatus.variant} label={displayStatus.label} />
              {policy.requiresReview &&
              policy.extractionConfidence !== null ? (
                <ConfidenceBadge confidence={policy.extractionConfidence} />
              ) : null}
            </div>
          </div>

          <dl
            className={cn(
              "mt-2.5 grid gap-2",
              compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
            )}
          >
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted">
                Premio
              </dt>
              <dd className="mt-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                {annualPremium !== null
                  ? formatCHF(annualPremium)
                  : getPolicyPremiumLabel(policy) === "Non disponibile"
                    ? "N/D"
                    : getPolicyPremiumLabel(policy)}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted">
                Persone
              </dt>
              <dd className="mt-0.5 text-[11px] font-medium text-foreground">
                {insuredCount > 0 ? insuredCount : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted">
                Coperture
              </dt>
              <dd className="mt-0.5 text-[11px] font-medium text-foreground">
                {coverageCount > 0 ? coverageCount : "—"}
              </dd>
            </div>
            {!compact ? (
              <div className="hidden sm:block">
                <dt className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Confidenza
                </dt>
                <dd className="mt-1">
                  <PolicyConfidenceRing confidence={policy.extractionConfidence} />
                </dd>
              </div>
            ) : null}
          </dl>

          {(detailSummary || renewalRelative) && (
            <p className="mt-2 rounded-md bg-card-muted/60 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
              {[
                policy.renewalDate
                  ? `Scadenza ${formatDate(policy.renewalDate)}${renewalRelative ? ` · ${renewalRelative}` : ""}`
                  : null,
                detailSummary || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2">
            {policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="inline-flex min-w-0 max-w-[58%] items-center gap-1 text-[10px] font-medium text-accent hover:text-accent-hover"
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">{policy.document.fileName}</span>
              </Link>
            ) : (
              <span className="text-[10px] text-muted">Nessun PDF collegato</span>
            )}
            <div className="flex items-center gap-2">
              {policy.requiresReview ? (
                <Link
                  href={`/policies/${policy.id}/edit`}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium text-accent"
                >
                  <Pencil className="h-3 w-3" />
                  Rivedi
                </Link>
              ) : null}
              <Link
                href={`/policies/${policy.id}`}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-accent"
              >
                Dettagli
                <ChevronRight className="atlas-link-chevron h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
