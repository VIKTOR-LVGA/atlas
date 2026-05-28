"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import {
  IconDashboard,
  IconPolicies,
  IconAnalysis,
  IconMarket,
  IconRecommendations,
  IconDocuments,
  IconConsulting,
  IconSettings,
  IconShield,
} from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/policies", label: "Le mie polizze", icon: IconPolicies },
  { href: "/analysis", label: "Analisi", icon: IconAnalysis },
  { href: "/market", label: "Confronto mercato", icon: IconMarket },
  { href: "/recommendations", label: "Raccomandazioni", icon: IconRecommendations },
  { href: "/documents", label: "Documenti", icon: IconDocuments },
  { href: "/consulting", label: "Consulenza", icon: IconConsulting },
  { href: "/settings", label: "Impostazioni", icon: IconSettings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const profile = useCurrentProfile();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center"
          onClick={onNavigate}
        >
          <AtlasBrandLogo variant="stacked" compact />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "atlas-nav-link relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] font-medium",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  : "text-muted-foreground hover:bg-card-muted/80 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0",
                  active ? "text-[var(--nav-active-icon)]" : "text-muted"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-sidebar-border p-4">
        <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border/80 bg-card/60 px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            {getProfileInitials(profile)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-foreground">
              {getProfileDisplayName(profile)}
            </p>
            <p className="truncate text-[10px] text-muted">
              {profile?.email ?? "Profilo Atlas"}
            </p>
          </div>
        </div>
        <div className="atlas-sidebar-promo rounded-xl border border-border/80 p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[10px] bg-card shadow-[var(--shadow-card)] ring-1 ring-border/60">
            <IconShield className="h-4 w-4 text-accent" />
          </div>
          <p className="text-[11px] font-semibold leading-snug text-foreground">
            Le tue polizze. La tua sicurezza. La nostra indipendenza.
          </p>
          <Link
            href="/dashboard#workflow"
            onClick={onNavigate}
            className="atlas-btn-secondary mt-3 w-full py-2 text-[11px]"
          >
            Scopri come funziona
          </Link>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,252px)] max-w-[calc(100vw-3rem)] flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:w-[252px] lg:max-w-none lg:shrink-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </aside>
    </>
  );
}
