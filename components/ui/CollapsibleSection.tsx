"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  description,
  badge,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-card-muted"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-foreground">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-[11px] text-muted">{description}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted transition",
              open && "rotate-180"
            )}
          />
        </span>
      </button>
      {open ? (
        <div className="border-t border-border-subtle px-5 py-4">{children}</div>
      ) : null}
    </section>
  );
}
