"use client";

import { Search } from "lucide-react";
import {
  documentFilterOptions,
  type DocumentFilterId,
} from "@/lib/document-intelligence";
import { cn } from "@/lib/utils";

type DocumentFilterBarProps = {
  activeFilter: DocumentFilterId;
  onFilterChange: (filterId: DocumentFilterId) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filterCounts: Record<DocumentFilterId, number>;
};

export function DocumentFilterBar({
  activeFilter,
  onFilterChange,
  query,
  onQueryChange,
  filterCounts,
}: DocumentFilterBarProps) {
  return (
    <div className="space-y-3 border-b border-border-subtle px-4 py-3 sm:px-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cerca per nome file, compagnia o numero polizza…"
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label="Cerca documenti"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {documentFilterOptions.map((option) => {
          const count = filterCounts[option.id];
          const isActive = activeFilter === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange(option.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                isActive
                  ? "border-accent/30 bg-accent-soft text-accent"
                  : "border-border-subtle bg-card text-muted-foreground hover:border-border hover:bg-card-muted"
              )}
            >
              {option.label}
              <span
                className={cn(
                  "tabular-nums text-[10px]",
                  isActive ? "text-accent" : "text-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
