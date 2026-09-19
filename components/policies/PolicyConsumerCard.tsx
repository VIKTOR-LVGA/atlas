import Link from "next/link";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyProductName, getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import { getPolicyAnnualPremium, premiumFrequencyLabels } from "@/lib/premium-totals";
import { formatScheduleDateFull } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";

export function PolicyConsumerCard({ policy }: { policy: UserPolicy }) {
  const category = getVisualCategoryForPolicy(policy);
  const productName = getPolicyProductName(policy);
  const annual = getPolicyAnnualPremium(policy);
  const deadline = policy.renewalDate || policy.endDate;
  const status = getPolicyStatusLabel(policy);

  return (
    <article className="atlas-consumer-card atlas-consumer-press flex min-h-[7.5rem] flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {category.label}
          </p>
          <h3 className="mt-1 truncate text-[16px] font-semibold tracking-tight text-foreground">
            {policy.provider || "Compagnia da indicare"}
          </h3>
          {productName ? (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{productName}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            typedPolicyIconStyles[policy.policyType]
          )}
        >
          <TypedPolicyIcon policyType={policy.policyType} className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[18px] font-semibold tracking-tight text-foreground">
            {annual !== null
              ? `${formatCHF(annual)} / anno`
              : policy.premiumAmount !== null
                ? `${formatCHF(policy.premiumAmount)} / ${premiumFrequencyLabels[policy.premiumFrequency]}`
                : "Premio da indicare"}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {deadline ? `Scadenza ${formatScheduleDateFull(deadline)}` : "Scadenza da indicare"}
            {" · "}
            {status}
          </p>
        </div>
        <Link
          href={`/policies/${policy.id}`}
          className="atlas-consumer-focus inline-flex min-h-10 min-w-16 items-center justify-center rounded-full bg-accent px-4 text-[12px] font-semibold text-accent-foreground"
        >
          Apri
        </Link>
      </div>
    </article>
  );
}
