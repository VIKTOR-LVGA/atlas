"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, HelpCircle, ChevronDown } from "lucide-react";
import { formatCHF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  buildCoverageDisplayTree,
  type DisplayCoverage,
  type CoverageStatusTone,
} from "@/lib/policy-experience/coverages";
import type { PolicyCoverageDetail } from "@/lib/types";

function StatusIcon({ tone }: { tone: CoverageStatusTone }) {
  if (tone === "included") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />;
  }
  if (tone === "excluded") {
    return <CircleDashed className="h-4 w-4 shrink-0 text-muted" aria-hidden />;
  }
  return <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />;
}

function toneLabel(tone: CoverageStatusTone) {
  if (tone === "included") return "Coperto";
  if (tone === "excluded") return "Non coperto";
  return "Da verificare";
}

function CoverageCompactCard({ item }: { item: DisplayCoverage }) {
  const [open, setOpen] = useState(false);
  const hasDetails =
    item.notes ||
    item.features.length > 0 ||
    item.children.length > 0 ||
    item.originalLabel;

  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-2.5",
        item.tone === "excluded" ? "border-border-subtle opacity-90" : "border-border"
      )}
    >
      <div className="flex items-start gap-2">
        <StatusIcon tone={item.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-foreground">{item.name}</p>
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {toneLabel(item.tone)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            {[
              item.premium != null ? `Premio ${formatCHF(item.premium)}` : null,
              item.deductible != null ? `Franchigia ${formatCHF(item.deductible)}` : null,
              item.limit != null ? `Limite ${formatCHF(item.limit)}` : null,
              item.features.length ? item.features.join(" · ") : null,
            ]
              .filter(Boolean)
              .join(" · ") || (item.tone === "included" ? "Inclusa" : null)}
          </p>
          {item.children.length > 0 ? (
            <p className="mt-1 text-[11px] text-muted">
              Include: {item.children.map((c) => c.name).join(", ")}
            </p>
          ) : null}
        </div>
        {hasDetails ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-md p-1 text-muted hover:bg-card-muted hover:text-foreground"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
            <span className="sr-only">Dettagli</span>
          </button>
        ) : null}
      </div>
      {open && hasDetails ? (
        <div className="mt-2 border-t border-border-subtle pt-2 text-[11px] leading-relaxed text-muted">
          {item.originalLabel && item.originalLabel !== item.name ? (
            <p>Come in polizza: {item.originalLabel}</p>
          ) : null}
          {item.notes ? <p className="mt-1">{item.notes}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

export function PolicyCoveragesTab({
  coverages,
}: {
  coverages: PolicyCoverageDetail[];
}) {
  const groups = buildCoverageDisplayTree(coverages);
  const includedCount = coverages.filter((c) => c.coverage_status !== "excluded").length;
  const excludedCount = coverages.filter((c) => c.coverage_status === "excluded").length;

  if (coverages.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-6 text-[13px] text-muted">
        Nessuna copertura strutturata estratta. Usa «Verifica dati» o modifica la polizza.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[12px] text-muted">
        {includedCount} coperte · {excludedCount} non incluse
      </p>
      {groups.map((group) => (
        <section key={group.groupId} className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {group.label}
          </h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <CoverageCompactCard key={item.key} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
