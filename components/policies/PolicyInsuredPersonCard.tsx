import { User } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatCHF, formatDate } from "@/lib/utils";
import type { PolicyInsuredPersonDetail } from "@/lib/types";

export function PolicyInsuredPersonCard({
  person,
}: {
  person: PolicyInsuredPersonDetail;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success-text)]">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">
              {person.name ?? "Persona assicurata"}
            </p>
            {person.birth_date ? (
              <p className="mt-0.5 text-[11px] text-muted">
                Nato/a il {formatDate(person.birth_date)}
              </p>
            ) : null}
            {person.insured_number ? (
              <p className="mt-0.5 text-[11px] text-muted">
                N. {person.insured_number}
              </p>
            ) : null}
          </div>
        </div>
        <ConfidenceBadge confidence={person.confidence} uncertain={person.uncertain} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <dt className="text-muted">Premio</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {person.premium_amount != null ? formatCHF(person.premium_amount) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Franchise</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {person.franchise != null || person.deductible != null
              ? formatCHF(person.franchise ?? person.deductible ?? 0)
              : "—"}
          </dd>
        </div>
        {person.model ? (
          <div className="col-span-2">
            <dt className="text-muted">Modello</dt>
            <dd className="mt-0.5 font-medium text-foreground">{person.model}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
