"use client";

import { useState } from "react";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconPlus,
  IconCompare,
  IconSearch,
  IconFilter,
  IconMoreVertical,
  IconChevronRight,
} from "@/components/icons";
import { policies, statusLabels } from "@/lib/mock-data";
import { categoryIconBg, PolicyCategoryIcon, ScoreRing } from "@/lib/policy-ui";
import type { PolicyCategory, PolicyStatus } from "@/lib/types";
import { formatCHF, formatDate, cn } from "@/lib/utils";

const categories: { key: PolicyCategory | "all"; label: string }[] = [
  { key: "all", label: "Tutte" },
  { key: "health", label: "Salute" },
  { key: "car", label: "Auto" },
  { key: "household", label: "Mobilia" },
  { key: "liability", label: "RC" },
  { key: "legal", label: "Giuridica" },
  { key: "life", label: "Vita" },
];

const statusVariant = {
  active: "active" as const,
  expiring: "expiring" as const,
  review: "review" as const,
};

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PolicyCategory | "all">("all");
  const [status, setStatus] = useState<PolicyStatus | "all">("all");

  const filtered = policies.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (status !== "all" && p.status !== status) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Le mie polizze"
        description="Gestisci, analizza e confronta tutte le tue polizze in un unico posto."
        action={
          <div className="flex flex-wrap gap-2">
            <SecondaryButton icon={<IconCompare className="h-4 w-4" />}>
              Confronta selezionate
            </SecondaryButton>
            <PrimaryButton href="/documents" icon={<IconPlus className="h-4 w-4" />}>
              Carica nuova polizza
            </PrimaryButton>
          </div>
        }
      />

      <SectionCard padding="none">
        <div className="flex flex-col gap-3 border-b border-slate-50 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Cerca polizza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PolicyCategory | "all")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PolicyStatus | "all")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Attive</option>
            <option value="expiring">In scadenza</option>
            <option value="review">Da rivedere</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700"
          >
            <IconFilter className="h-4 w-4" />
            Altri filtri
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-3 py-2.5">Polizza</th>
                <th className="px-3 py-2.5">Compagnia</th>
                <th className="px-3 py-2.5">Premio annuo</th>
                <th className="px-3 py-2.5">Stato</th>
                <th className="px-3 py-2.5">Score</th>
                <th className="px-3 py-2.5">Scadenza</th>
                <th className="px-3 py-2.5">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          categoryIconBg[p.category]
                        )}
                      >
                        <PolicyCategoryIcon category={p.category} />
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.policyNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-slate-700">{p.insurer}</span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {formatCHF(p.annualPremium)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge variant={statusVariant[p.status]} label={statusLabels[p.status]} />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreRing score={p.coverageScore} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-slate-800">{formatDate(p.renewalDate)}</p>
                    <p
                      className={cn(
                        "text-[10px]",
                        p.daysUntilRenewal <= 60 ? "text-red-600" : "text-slate-400"
                      )}
                    >
                      Tra {p.daysUntilRenewal} giorni
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <LinkAction href={`/policies/${p.id}`}>Dettagli</LinkAction>
                      <LinkAction href="/market">Confronta</LinkAction>
                      <button type="button" className="text-slate-400">
                        <IconMoreVertical />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-50 px-4 py-3 sm:flex-row">
          <p className="text-[12px] text-slate-500">
            1–{filtered.length} di {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            {[1].map((n) => (
              <button
                key={n}
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[12px] font-medium text-white"
              >
                {n}
              </button>
            ))}
            <button type="button" className="p-1 text-slate-400">
              <IconChevronRight />
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
