import Link from "next/link";
import type { Policy, PolicyCategory, PolicyStatus } from "@/lib/types";
import { formatCHF, formatDate, cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { IconChevronRight } from "@/components/icons";

const categoryLabels: Record<PolicyCategory, string> = {
  health: "Salute",
  car: "Auto",
  household: "Mobilia",
  liability: "RC",
  legal: "Giuridica",
  life: "Vita",
};

const statusLabels: Record<PolicyStatus, string> = {
  active: "Attiva",
  expiring: "In scadenza",
  review: "Da rivedere",
};

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  expiring: "warning",
  review: "danger",
};

interface PolicyCardProps {
  policy: Policy;
  compact?: boolean;
}

export function PolicyCard({ policy, compact }: PolicyCardProps) {
  return (
    <Link
      href={`/policies/${policy.id}`}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:border-border hover:shadow-md",
        compact && "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{categoryLabels[policy.category]}</Badge>
            <Badge variant={statusVariant[policy.status]}>
              {statusLabels[policy.status]}
            </Badge>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-foreground group-hover:text-accent">
            {policy.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{policy.insurer}</p>
        </div>
        <IconChevronRight className="mt-1 shrink-0 text-muted transition group-hover:text-muted" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs text-muted">Premio annuo</p>
          <p className="font-medium text-foreground">{formatCHF(policy.annualPremium)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Copertura</p>
          <p className="font-medium text-foreground">{policy.coverageScore}%</p>
        </div>
        {!compact && (
          <div>
            <p className="text-xs text-muted">Rinnovo</p>
            <p className="font-medium text-foreground">{formatDate(policy.renewalDate)}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
