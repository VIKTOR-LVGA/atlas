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
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900">
              {person.name ?? "Persona assicurata"}
            </p>
            {person.birth_date ? (
              <p className="mt-0.5 text-[11px] text-slate-500">
                Nato/a il {formatDate(person.birth_date)}
              </p>
            ) : null}
            {person.insured_number ? (
              <p className="mt-0.5 text-[11px] text-slate-500">
                N. {person.insured_number}
              </p>
            ) : null}
          </div>
        </div>
        <ConfidenceBadge confidence={person.confidence} uncertain={person.uncertain} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <dt className="text-slate-400">Premio</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            {person.premium_amount != null ? formatCHF(person.premium_amount) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Franchise</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            {person.franchise != null || person.deductible != null
              ? formatCHF(person.franchise ?? person.deductible ?? 0)
              : "—"}
          </dd>
        </div>
        {person.model ? (
          <div className="col-span-2">
            <dt className="text-slate-400">Modello</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{person.model}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
