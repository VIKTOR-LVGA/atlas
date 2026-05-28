"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardAdvancedPanelProps = {
  alertCount: number;
  children: ReactNode;
};

export function DashboardAdvancedPanel({
  alertCount,
  children,
}: DashboardAdvancedPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="atlas-card-secondary overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card-muted text-accent ring-1 ring-border/70">
            <Layers className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-foreground">
              Dettagli avanzati e Pro view
            </span>
            <span className="mt-0.5 block text-[11px] text-muted">
              KPI, workflow, alert completi e liste recenti
              {alertCount > 0 ? ` · ${alertCount} segnalazioni` : ""}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border-subtle px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/recommendations"
              className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-foreground hover:bg-card-muted"
            >
              Intelligence feed
            </Link>
            <Link
              href="/analysis"
              className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-foreground hover:bg-card-muted"
            >
              Analisi portafoglio
            </Link>
            <Link
              href="/market"
              className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-foreground hover:bg-card-muted"
            >
              Mercato
            </Link>
            <Link
              href="/documents"
              className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-medium text-foreground hover:bg-card-muted"
            >
              Archivio documenti
            </Link>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  );
}
