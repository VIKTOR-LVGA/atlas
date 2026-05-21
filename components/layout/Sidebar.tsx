"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
            <p className="text-[15px] font-semibold leading-tight text-slate-900">Atlas</p>
            <p className="text-[11px] leading-tight text-slate-500">Analisi indipendente</p>
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              )}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
              )}
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-blue-600" : "text-slate-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/40 p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <IconShield className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <p className="text-[12px] font-semibold leading-snug text-slate-800">
            Le tue polizze. La tua sicurezza. La nostra indipendenza.
          </p>
          <Link
            href="/"
            onClick={onNavigate}
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
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
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <IconLogo className="h-8 w-8" />
          <span className="text-sm font-semibold text-slate-900">Atlas</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Menu"
        >
          <IconMenu />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-100 bg-[#f8fafc] transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
