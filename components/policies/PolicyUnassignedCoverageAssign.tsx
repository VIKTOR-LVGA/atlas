"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import {
  assignCoverageToInsuredPersonAction,
  type AssignCoverageActionState,
} from "@/app/(app)/policies/actions";
import { getCoverageNetPremium } from "@/lib/policy-health-grouping";
import type { PolicyCoverageDetail } from "@/lib/types";
import { formatCHF } from "@/lib/utils";

export type UnassignedCoverageAssignItem = {
  stableKey: string;
  coverage: PolicyCoverageDetail;
};

export type InsuredPersonAssignOption = {
  stableKey: string;
  label: string;
};

const initialState: AssignCoverageActionState = {
  status: "idle",
  message: "",
};

function formatCoverageLabel(coverage: PolicyCoverageDetail) {
  const label = coverage.category_label ?? coverage.coverage_type ?? coverage.name;
  const net = getCoverageNetPremium(coverage);
  const premium =
    net !== null && net !== undefined ? formatCHF(net) : "—";

  if (coverage.name !== label && coverage.name.length < 48) {
    return `${label} — ${coverage.name} · ${premium}`;
  }

  return `${label} · ${premium}`;
}

function AssignCoverageRow({
  policyId,
  item,
  people,
}: {
  policyId: string;
  item: UnassignedCoverageAssignItem;
  people: InsuredPersonAssignOption[];
}) {
  const [state, formAction, pending] = useActionState(
    assignCoverageToInsuredPersonAction.bind(null, policyId),
    initialState
  );

  return (
    <li className="rounded-xl border border-amber-100/80 bg-amber-50/30 p-3">
      <p className="text-[12px] font-medium leading-snug text-slate-800">
        {formatCoverageLabel(item.coverage)}
      </p>
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="coverage_stable_key" value={item.stableKey} />
        <label className="block">
          <span className="sr-only">Persona assicurata</span>
          <select
            name="insured_person_key"
            required
            defaultValue=""
            disabled={pending || people.length === 0}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          >
            <option value="" disabled>
              Scegli la persona
            </option>
            {people.map((person) => (
              <option key={person.stableKey} value={person.stableKey}>
                {person.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending || people.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {pending ? "Assegnazione..." : "Assegna"}
        </button>
        {state.status === "error" ? (
          <p aria-live="polite" className="text-[11px] text-red-600">
            {state.message}
          </p>
        ) : null}
      </form>
    </li>
  );
}

export function PolicyUnassignedCoverageAssign({
  policyId,
  items,
  people,
}: {
  policyId: string;
  items: UnassignedCoverageAssignItem[];
  people: InsuredPersonAssignOption[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <AssignCoverageRow
          key={item.stableKey}
          policyId={policyId}
          item={item}
          people={people}
        />
      ))}
    </ul>
  );
}
