import Link from "next/link";
import { FileText, PencilLine } from "lucide-react";
import { PolicyConfirmReviewButton } from "@/components/policies/PolicyConfirmReviewButton";
import { PolicyConfidenceRing } from "@/components/policies/PolicyConfidenceRing";
import {
  formatRenewalRelative,
  getDaysUntilRenewal,
  getPolicyAnnualPremium,
  getPolicyDisplayStatus,
  getPolicyPremiumLabel,
} from "@/components/policies/policy-portfolio-display";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyReviewStatusBadge, getPolicyTypeLabel } from "@/lib/policy-types";
import { formatCHF } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PolicyExecutiveHeaderProps {
  policy: UserPolicy;
  insuredCount: number;
  coverageCount: number;
}

export function PolicyExecutiveHeader({
  policy,
  insuredCount,
  coverageCount,
}: PolicyExecutiveHeaderProps) {
  const policyTypeLabel = getPolicyTypeLabel(
    policy.policyType,
    policy.policyCategoryLabel
  );
  const displayStatus = getPolicyDisplayStatus(policy);
  const reviewStatus = getPolicyReviewStatusBadge(policy);
  const renewalDays = getDaysUntilRenewal(policy.renewalDate);
  const renewalRelative = formatRenewalRelative(renewalDays);
  const annualPremium = getPolicyAnnualPremium(policy);

  return (
    <header className="atlas-card-primary overflow-hidden">
      <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/50 via-card to-card px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ring-1 ring-black/5 dark:ring-white/5 sm:h-12 sm:w-12",
                typedPolicyIconStyles[policy.policyType]
              )}
            >
              <TypedPolicyIcon policyType={policy.policyType} className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0">
              <p className="atlas-section-eyebrow text-accent">Sintesi polizza</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <StatusBadge variant={displayStatus.variant} label={displayStatus.label} />
                <StatusBadge variant={reviewStatus.variant} label={reviewStatus.label} />
                {policy.source === "ai_draft" ? (
                  <StatusBadge variant="processing" label="Estrazione AI" />
                ) : null}
              </div>
              <h1 className="mt-1.5 truncate text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
                {policy.provider || "Non disponibile"}
              </h1>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{policyTypeLabel}</p>
              {policy.policyNumber ? (
                <p className="mt-0.5 text-[11px] text-muted">
                  Polizza {policy.policyNumber}
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-muted">Numero polizza — Da verificare</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <PolicyConfidenceRing
              confidence={policy.extractionConfidence}
              size="md"
            />
            {policy.requiresReview ? (
              <>
                <Link
                  href={`/policies/${policy.id}/edit`}
                  className="atlas-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] shadow-sm"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Rivedi
                </Link>
                <PolicyConfirmReviewButton policyId={policy.id} />
              </>
            ) : (
              <Link
                href={`/policies/${policy.id}/edit`}
                className="atlas-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px]"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Modifica
              </Link>
            )}
          </div>
        </div>
      </div>

      <PolicySummaryStatGrid
        stats={[
          {
            id: "premium",
            label: "Premio",
            value: getPolicyPremiumLabel(policy),
            sub:
              annualPremium !== null
                ? `${formatCHF(annualPremium)} stimato / anno`
                : "Da verificare",
          },
          {
            id: "renewal",
            label: "Rinnovo",
            value: policy.renewalDate
              ? new Date(`${policy.renewalDate}T12:00:00`).toLocaleDateString(
                  "it-CH"
                )
              : "Non disponibile",
            sub: renewalRelative ?? "Data non indicata",
            highlight:
              renewalDays !== null && renewalDays >= 0 && renewalDays <= 30,
          },
          {
            id: "people",
            label: "Persone",
            value: insuredCount > 0 ? String(insuredCount) : "Non disponibile",
            sub:
              insuredCount > 0
                ? insuredCount === 1
                  ? "assicurata"
                  : "assicurate"
                : "Nessuna persona rilevata",
          },
          {
            id: "coverages",
            label: "Coperture",
            value: coverageCount > 0 ? String(coverageCount) : "Non disponibile",
            sub:
              coverageCount > 0 ? "nel documento" : "Nessuna copertura rilevata",
          },
          {
            id: "document",
            label: "PDF sorgente",
            value: policy.document ? "Collegato" : "Non disponibile",
            sub: policy.document ? (
              <Link
                href={`/documents/${policy.document.id}`}
                className="atlas-link-action inline-flex min-w-0 items-center gap-0.5 text-accent"
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">{policy.document.fileName}</span>
              </Link>
            ) : (
              "Nessun documento collegato"
            ),
          },
        ]}
      />
    </header>
  );
}

type PolicySummaryStat = {
  id: string;
  label: string;
  value: string;
  sub: React.ReactNode;
  highlight?: boolean;
};

function getSummaryGridClass(count: number) {
  if (count <= 1) {
    return "grid-cols-1";
  }

  if (count === 2) {
    return "grid-cols-2";
  }

  if (count === 3) {
    return "grid-cols-2 sm:grid-cols-3";
  }

  if (count === 4) {
    return "grid-cols-2 lg:grid-cols-4";
  }

  return "grid-cols-2 lg:grid-cols-5";
}

function PolicySummaryStatGrid({ stats }: { stats: PolicySummaryStat[] }) {
  const gridClass = getSummaryGridClass(stats.length);
  const spanLastOnTwoCol =
    stats.length % 2 === 1 && stats.length !== 3;

  return (
    <div className={cn("grid gap-px bg-border-subtle", gridClass)}>
      {stats.map((stat, index) => (
        <HeaderStat
          key={stat.id}
          label={stat.label}
          value={stat.value}
          sub={stat.sub}
          highlight={stat.highlight}
          className={cn(
            spanLastOnTwoCol &&
              index === stats.length - 1 &&
              "col-span-2 lg:col-span-1"
          )}
        />
      ))}
    </div>
  );
}

function HeaderStat({
  label,
  value,
  sub,
  highlight = false,
  className,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card px-3 py-2.5 sm:px-3.5",
        highlight && "bg-[var(--warning-bg)]/30",
        className
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground">{value}</p>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
