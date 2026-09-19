"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconDocuments,
  IconPolicies,
  IconSettings,
  IconSparkle,
} from "@/components/icons";
import {
  consumerNavItems,
  isConsumerNavActive,
  type ConsumerNavId,
} from "@/lib/consumer-nav";
import { cn } from "@/lib/utils";

const icons: Record<ConsumerNavId, typeof IconDashboard> = {
  home: IconDashboard,
  policies: IconPolicies,
  documents: IconDocuments,
  opportunities: IconSparkle,
  profile: IconSettings,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-2 pt-1 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {consumerNavItems.map((item) => {
          const active = isConsumerNavActive(pathname, item.href);
          const Icon = icons[item.id];

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition",
                  active
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.mobileLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
