"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import {
  IconDashboard,
  IconDocuments,
  IconPolicies,
  IconSettings,
  IconSparkle,
} from "@/components/icons";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
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

function SidebarContent() {
  const pathname = usePathname();
  const profile = useCurrentProfile();

  return (
    <>
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center">
          <AtlasBrandLogo variant="stacked" compact />
        </Link>
      </div>

      <nav aria-label="Navigazione principale" className="flex-1 space-y-1 px-3 py-5">
        {consumerNavItems.map((item) => {
          const active = isConsumerNavActive(pathname, item.href);
          const Icon = icons[item.id];

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-muted-foreground hover:bg-card-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-[var(--nav-active-icon)]" : "text-muted"
                )}
              />
              <span className="truncate">{item.desktopLabel}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 hover:bg-card-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            {getProfileInitials(profile)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-foreground">
              {getProfileDisplayName(profile)}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {profile?.email ?? "Profilo"}
            </span>
          </span>
        </Link>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarContent />
    </aside>
  );
}
