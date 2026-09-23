"use client";

import { useState } from "react";
import Link from "next/link";
import { VerificationBadge } from "@/components/insurance-os/VerificationBadge";
import {
  statusExplanation,
  statusLabel,
  type CoverageMapStatus,
} from "@/lib/insurance-os/coverage-categories";
import type {
  CoverageMapCategoryView,
  CoverageMapFact,
} from "@/lib/insurance-os/coverage-map-types";
import { cn } from "@/lib/utils";

const statusDot: Record<CoverageMapStatus, string> = {
  covered: "bg-[var(--success-text)]",
  partially_known: "bg-[var(--info-text)]",
  needs_verification: "bg-[var(--warning-text)]",
  no_policy_found: "bg-[var(--muted)]",
  not_applicable: "bg-[var(--border)]",
};

const statusRing: Record<CoverageMapStatus, string> = {
  covered: "border-[var(--success-border)]",
  partially_known: "border-[var(--info-border)]",
  needs_verification: "border-[var(--warning-border)]",
  no_policy_found: "border-border",
  not_applicable: "border-border-subtle",
};

function FactRow({ fact }: { fact: CoverageMapFact }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{fact.label}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          {[
            fact.limit != null ? `Limite ${fact.limit.toLocaleString("it-CH")}` : null,
            fact.deductible != null
              ? `Franchigia ${fact.deductible.toLocaleString("it-CH")}`
              : null,
            fact.sourcePage != null ? `Pag. ${fact.sourcePage}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Dettagli non estratti dal documento"}
        </p>
        {fact.evidence ? (
          <p className="mt-1 line-clamp-2 text-[11px] italic leading-relaxed text-muted">
            «{fact.evidence}»
          </p>
        ) : null}
      </div>
      <VerificationBadge status={fact.verificationStatus} detailed />
    </li>
  );
}

function CategoryDetail({ category }: { category: CoverageMapCategoryView }) {
  const hasContent =
    category.policies.length > 0 ||
    category.coverages.length > 0 ||
    category.exclusions.length > 0 ||
    category.needsVerification.length > 0;

  return (
    <div className="border-t border-border-subtle px-4 py-4">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {category.explanation || statusExplanation(category.status)}
      </p>

      {category.policies.length > 0 ? (
        <div className="mt-4">
          <p className="atlas-section-eyebrow">Polizze collegate</p>
          <ul className="mt-2 space-y-1.5">
            {category.policies.map((policy) => (
              <li key={policy.id}>
                <Link
                  href={`/policies/${policy.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-card-muted"
                >
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {policy.provider}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {policy.policyNumber ?? "Numero non estratto"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {category.coverages.length > 0 ? (
        <div className="mt-4">
          <p className="atlas-section-eyebrow">Coperture trovate</p>
          <ul className="mt-1 divide-y divide-border-subtle">
            {category.coverages.slice(0, 8).map((fact) => (
              <FactRow key={fact.id} fact={fact} />
            ))}
          </ul>
        </div>
      ) : null}

      {category.exclusions.length > 0 ? (
        <div className="mt-4">
          <p className="atlas-section-eyebrow">Esclusioni rilevate</p>
          <ul className="mt-1 divide-y divide-border-subtle">
            {category.exclusions.slice(0, 6).map((fact) => (
              <FactRow key={fact.id} fact={fact} />
            ))}
          </ul>
        </div>
      ) : null}

      {category.needsVerification.length > 0 ? (
        <div className="mt-4">
          <p className="atlas-section-eyebrow">Da verificare</p>
          <ul className="mt-1 divide-y divide-border-subtle">
            {category.needsVerification.slice(0, 6).map((fact) => (
              <FactRow key={fact.id} fact={fact} />
            ))}
          </ul>
        </div>
      ) : null}

      {!hasContent ? (
        <Link
          href="/documents"
          className="atlas-btn-secondary mt-4 min-h-10 w-full text-[13px] sm:w-auto"
        >
          Carica un documento per quest’area
        </Link>
      ) : null}
    </div>
  );
}

export function CoverageMap({
  categories,
  title = "Mappa delle coperture",
  description,
  defaultOpenId = null,
}: {
  categories: CoverageMapCategoryView[];
  title?: string;
  description?: string;
  defaultOpenId?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const open = openId === category.id;
          const factCount =
            category.coverages.length +
            category.exclusions.length +
            category.needsVerification.length;

          return (
            <div
              key={category.id}
              className={cn(
                "atlas-consumer-card atlas-consumer-press overflow-hidden border",
                statusRing[category.status],
                open ? "sm:col-span-2 xl:col-span-3" : null
              )}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : category.id)}
                aria-expanded={open}
                className="atlas-consumer-focus flex w-full min-h-[4.5rem] items-start justify-between gap-3 px-4 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn("h-2 w-2 shrink-0 rounded-full", statusDot[category.status])}
                    />
                    <span className="truncate text-[14px] font-semibold tracking-tight text-foreground">
                      {category.label}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px] text-muted">
                    {statusLabel(category.status)}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">
                  {category.policies.length > 0
                    ? `${category.policies.length} pol.${factCount > 0 ? ` · ${factCount} voci` : ""}`
                    : "—"}
                </span>
              </button>

              {open ? <CategoryDetail category={category} /> : null}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        «Nessuna polizza caricata» non significa che sei scoperto: significa che ATLAS non
        ha ancora un documento che confermi quell’area.
      </p>
    </section>
  );
}
