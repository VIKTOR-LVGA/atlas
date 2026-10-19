import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyProductName, getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import { getPolicyAnnualPremium, premiumFrequencyLabels } from "@/lib/premium-totals";
import { formatScheduleDateFull } from "@/lib/policy-schedule";
import { formatCHF, cn } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";

export function PolicyConsumerCard({policy}:{policy:UserPolicy}){
  const category=getVisualCategoryForPolicy(policy);
  const productName=getPolicyProductName(policy);
  const annual=getPolicyAnnualPremium(policy);
  const deadline=policy.renewalDate||policy.endDate;
  const status=getPolicyStatusLabel(policy);
  const premium=annual!==null?formatCHF(annual)+" / anno":
    policy.premiumAmount!==null?formatCHF(policy.premiumAmount)+" / "+premiumFrequencyLabels[policy.premiumFrequency]:"Premio da verificare";
  return (
    <article className="atlas-consumer-card atlas-consumer-press group flex min-h-[205px] flex-col justify-between p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]",typedPolicyIconStyles[policy.policyType])}>
          <TypedPolicyIcon policyType={policy.policyType} className="h-[23px] w-[23px]"/>
        </span>
        <span className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold",policy.requiresReview?"bg-[var(--warning-bg)] text-[var(--warning-text)]":"bg-card-muted text-muted-foreground")}>
          {policy.requiresReview?"Da verificare":status}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted">{category.label}</p>
        <h3 className="mt-1 truncate text-[18px] font-bold tracking-[-.035em] text-foreground">{policy.provider||"Compagnia da indicare"}</h3>
        {productName?<p className="mt-0.5 truncate text-[12px] text-muted-foreground">{productName}</p>:null}
      </div>
      <div className="mt-5 flex items-end justify-between gap-2 border-t border-border-subtle pt-4">
        <div className="min-w-0">
          <p className="break-words text-[15px] font-bold tracking-[-.02em] text-foreground">{premium}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
            <CalendarDays className="h-3 w-3" aria-hidden/> {deadline?formatScheduleDateFull(deadline):"Scadenza non disponibile"}
          </p>
        </div>
        <Link href={`/policies/${policy.id}`} className="atlas-consumer-focus inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-[13px] bg-accent-soft px-3.5 text-[12px] font-bold text-accent hover:bg-accent hover:text-white">
          Apri <ArrowUpRight className="h-4 w-4"/>
        </Link>
      </div>
    </article>
  );
}
