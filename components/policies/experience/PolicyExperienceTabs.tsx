"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  policyExperienceTabLabels,
  type PolicyExperienceTab,
} from "@/lib/policy-experience/tabs";

const TABS: PolicyExperienceTab[] = [
  "overview",
  "coverages",
  "opportunities",
  "document",
  "review",
];

export function PolicyExperienceTabs({
  policyId,
  active,
}: {
  policyId: string;
  active: PolicyExperienceTab;
}) {
  return (
    <nav
      aria-label="Sezioni polizza"
      className="sticky top-0 z-20 -mx-1 overflow-x-auto border-b border-border bg-[color-mix(in_srgb,var(--background)_95%,transparent)] px-1 backdrop-blur-xl"
    >
      <ul className="flex min-w-max gap-1 py-2">
        {TABS.map((tab) => {
          const selected = tab === active;
          return (
            <li key={tab}>
              <Link
                href={`/policies/${policyId}?view=${tab}`}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center rounded-[13px] px-4 text-[12px] font-semibold transition-colors sm:text-[13px]",
                  selected
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-card-muted hover:text-foreground"
                )}
              >
                {policyExperienceTabLabels[tab]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
