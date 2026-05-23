"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { getProfileDisplayName, getProfileInitials } from "@/lib/profile-display";
import {
  IconLogo,
  IconMenu,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const profile = useCurrentProfile();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="flex h-[60px] items-center gap-2.5 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <IconLogo className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-foreground">Atlas</p>
            <p className="text-[11px] leading-tight text-muted">Analisi indipendente</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-muted hover:bg-card-muted hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-[var(--nav-active-icon)]" : "text-muted"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="mb-3 flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-card)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            {getProfileInitials(profile)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground">
              {getProfileDisplayName(profile)}
            </p>
            <p className="truncate text-[10px] text-muted">
              {profile?.email ?? "Profilo Atlas"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-accent-soft p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-[var(--shadow-card)]">
            <IconShield className="h-[18px] w-[18px] text-accent" />
          </div>
          <p className="text-[12px] font-semibold leading-snug text-foreground">
            Le tue polizze. La tua sicurezza. La nostra indipendenza.
          </p>
          <Link
            href="/"
            onClick={onNavigate}
            className="atlas-btn-secondary mt-3 w-full"
          >
            Scopri come funziona
          </Link>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-card px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <IconLogo className="h-8 w-8" />
          <span className="text-sm font-semibold text-foreground">Atlas</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted hover:bg-card-muted hover:text-foreground"
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <IconMenu />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,250px)] flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:w-[250px] lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
