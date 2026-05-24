"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FileText,
  MoreVertical,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { PolicyConfidenceRing } from "@/components/policies/PolicyConfidenceRing";
import { PolicyListCard } from "@/components/policies/PolicyListCard";
import {
  formatRenewalRelative,
  getDaysUntilRenewal,
  getPolicyAnnualPremium,
  getPolicyDisplayStatus,
  matchesPolicyFilters,
  type PolicyPortfolioCategoryFilter,
  type PolicyPortfolioStatusFilter,
} from "@/components/policies/policy-portfolio-display";
import { TypedPolicyIcon, typedPolicyIconStyles } from "@/lib/policy-display";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import type { UserPolicy } from "@/lib/types";
import { cn, formatCHF, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";

const categoryOptions: { value: PolicyPortfolioCategoryFilter; label: string }[] = [
  { value: "all", label: "Tutte le categorie" },
  { value: "health", label: "Cassa malati" },
  { value: "car", label: "Auto" },
  { value: "household", label: "Economia domestica" },
  { value: "liability", label: "RC privata" },
  { value: "legal", label: "Protezione giuridica" },
  { value: "other", label: "Altro" },
];

const statusOptions: { value: PolicyPortfolioStatusFilter; label: string }[] = [
  { value: "all", label: "Tutti gli stati" },
  { value: "review", label: "Da rivedere" },
  { value: "active", label: "Attive" },
  { value: "expiring", label: "In scadenza" },
  { value: "ai_draft", label: "Bozze AI" },
  { value: "manual", label: "Manuali" },
];

interface PolicyPortfolioWorkspaceProps {
  policies: UserPolicy[];
}

function PolicyRowActions({ policy }: { policy: UserPolicy }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/policies/${policy.id}`}
        className="hidden rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-accent-soft hover:text-accent sm:inline-flex"
      >
        Dettagli
      </Link>
      {policy.requiresReview ? (
        <Link
          href={`/policies/${policy.id}/edit`}
          className="hidden rounded-md px-2 py-1 text-[11px] font-medium text-accent transition hover:bg-accent-soft sm:inline-flex"
        >
          Rivedi
        </Link>
      ) : null}
      <details className="relative">
        <summary
          className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md border border-border/80 bg-card text-muted transition hover:bg-card-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
          aria-label={`Azioni per ${policy.provider}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </summary>
        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-card p-1 shadow-[var(--shadow-card-hover)]">
          <Link
            href={`/policies/${policy.id}`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent-soft hover:text-accent"
          >
            Dettagli
          </Link>
          <Link
            href={`/policies/${policy.id}/edit`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent-soft hover:text-accent"
          >
            <Pencil className="h-3 w-3" />
            Modifica
          </Link>
          {policy.document ? (
            <Link
              href={`/documents/${policy.document.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent-soft hover:text-accent"
            >
              <FileText className="h-3 w-3" />
              PDF collegato
            </Link>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function PolicyTableRow({ policy }: { policy: UserPolicy }) {
  const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);
  const displayStatus = getPolicyDisplayStatus(policy);
  const annualPremium = getPolicyAnnualPremium(policy);
  const renewalDays = getDaysUntilRenewal(policy.renewalDate);
  const renewalRelative = formatRenewalRelative(renewalDays);

  return (
    <tr className="atlas-row-interactive group border-b border-border-subtle">
      <td className="px-3 py-2.5">
        <Link href={`/policies/${policy.id}`} className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-black/5 dark:ring-white/5",
              typedPolicyIconStyles[policy.policyType]
            )}
          >
            <TypedPolicyIcon policyType={policy.policyType} className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-foreground group-hover:text-accent">
              {typeLabel}
            </span>
            <span className="mt-px block truncate text-[10px] text-muted-foreground">
              {policy.policyNumber ?? "Numero non disponibile"}
            </span>
          </span>
        </Link>
      </td>
      <td className="hidden px-3 py-2.5 md:table-cell">
        <span className="block truncate text-[12px] font-medium text-foreground">
          {policy.provider || "—"}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className="block text-[12px] font-semibold tabular-nums text-foreground">
          {annualPremium !== null ? formatCHF(annualPremium) : "N/D"}
        </span>
        <span className="text-[10px] text-muted-foreground">/ anno</span>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge variant={displayStatus.variant} label={displayStatus.label} />
      </td>
      <td className="hidden px-3 py-2.5 lg:table-cell">
        <PolicyConfidenceRing confidence={policy.extractionConfidence} />
      </td>
      <td className="hidden px-3 py-2.5 sm:table-cell">
        {policy.renewalDate ? (
          <span>
            <span className="block text-[12px] font-medium text-foreground">
              {formatDate(policy.renewalDate)}
            </span>
            {renewalRelative ? (
              <span
                className={cn(
                  "text-[10px]",
                  renewalDays !== null && renewalDays <= 30
                    ? "text-[var(--warning-text)]"
                    : "text-muted-foreground"
                )}
              >
                {renewalRelative}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-[11px] text-muted">Non disponibile</span>
        )}
      </td>
      <td className="px-2 py-2.5">
        <PolicyRowActions policy={policy} />
      </td>
    </tr>
  );
}

export function PolicyPortfolioWorkspace({ policies }: PolicyPortfolioWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PolicyPortfolioCategoryFilter>("all");
  const [status, setStatus] = useState<PolicyPortfolioStatusFilter>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredPolicies = useMemo(
    () =>
      policies.filter((policy) =>
        matchesPolicyFilters(policy, query, category, status)
      ),
    [policies, query, category, status]
  );

  return (
    <div className="atlas-stack-block">
      <div className="atlas-surface-card p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca per polizza, compagnia o numero…"
              className="atlas-input h-9 pl-8 text-[12px]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as PolicyPortfolioCategoryFilter)
              }
              className="atlas-input h-9 min-w-0 text-[12px] sm:min-w-[9.5rem]"
              aria-label="Filtra per categoria"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PolicyPortfolioStatusFilter)
              }
              className="atlas-input h-9 min-w-0 text-[12px] sm:min-w-[8.5rem]"
              aria-label="Filtra per stato"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              className={cn(
                "atlas-btn-secondary col-span-2 h-9 px-3 text-[11px] sm:col-span-1",
                showAdvanced && "border-accent/30 bg-accent-soft text-accent"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Altri filtri
            </button>
          </div>
        </div>
        {showAdvanced ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Usa gli stati &quot;Bozze AI&quot; o &quot;Manuali&quot; per filtrare per origine
            della scheda.
          </p>
        ) : null}
      </div>

      <div className="atlas-surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3.5 py-2">
          <p className="text-[12px] font-semibold text-foreground">Portafoglio polizze</p>
          <p className="text-[10px] text-muted-foreground">
            {filteredPolicies.length} di {policies.length} polizza
            {policies.length === 1 ? "" : "e"}
          </p>
        </div>

        {filteredPolicies.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[12px] font-medium text-foreground">
              Nessuna polizza corrisponde ai filtri
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Prova a modificare ricerca o categoria.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-subtle bg-card-muted/40 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                    <th className="px-3 py-2 font-semibold">Polizza</th>
                    <th className="hidden px-3 py-2 font-semibold md:table-cell">Compagnia</th>
                    <th className="px-3 py-2 font-semibold">Premio annuo</th>
                    <th className="px-3 py-2 font-semibold">Stato</th>
                    <th className="hidden px-3 py-2 font-semibold lg:table-cell">Confidenza</th>
                    <th className="hidden px-3 py-2 font-semibold sm:table-cell">Scadenza</th>
                    <th className="px-2 py-2 text-right font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                    <PolicyTableRow key={policy.id} policy={policy} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2.5 p-3 md:hidden">
              {filteredPolicies.map((policy) => (
                <PolicyListCard key={policy.id} policy={policy} compact />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
