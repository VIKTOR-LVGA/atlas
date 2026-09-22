"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileSignature,
  LayoutDashboard,
  LineChart,
  LogOut,
  Search,
  ScrollText,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { searchPartnerAction } from "@/app/partner/search-action";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  badge?: number;
};

const icons = {
  dashboard: LayoutDashboard,
  pipeline: BriefcaseBusiness,
  clients: Users,
  appointments: CalendarDays,
  offers: ScrollText,
  contracts: FileSignature,
  revenue: Wallet,
  analytics: LineChart,
  profile: UserRound,
};

type SearchHit = { id: string; label: string; detail: string; href: string };

const COMMANDS = [
  { label: "Apri richieste ATLAS", href: "/broker/requests" },
  { label: "Apri clienti ATLAS", href: "/broker/clients" },
  { label: "Apri appuntamenti", href: "/broker/appointments" },
  { label: "Apri offerte", href: "/broker/offers" },
  { label: "Apri contratti", href: "/broker/contracts" },
  { label: "Apri commissioni", href: "/broker/commissions" },
  { label: "Apri analytics", href: "/broker/analytics" },
  { label: "Apri profilo", href: "/broker/profile" },
];

export function PartnerShell({
  children,
  subtitle,
  nav,
  brandLabel = "Broker Workspace",
  homeHref = "/broker/dashboard",
}: {
  children: React.ReactNode;
  subtitle: string;
  nav: NavItem[];
  brandLabel?: string;
  homeHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hits, setHits] = useState<{
    clients: SearchHit[];
    leads: SearchHit[];
    contracts: SearchHit[];
    offers: SearchHit[];
  }>({ clients: [], leads: [], contracts: [], offers: [] });
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchPartnerAction(value);
        setHits(result);
      });
    }, 220);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        setOpen(true);
        queueMicrotask(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flatHits = useMemo(
    () => [
      ...hits.clients.map((h) => ({ ...h, group: "Clienti" })),
      ...hits.leads.map((h) => ({ ...h, group: "Richieste" })),
      ...hits.contracts.map((h) => ({ ...h, group: "Contratti" })),
      ...hits.offers.map((h) => ({ ...h, group: "Offerte" })),
    ],
    [hits]
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="border-b border-sidebar-border bg-sidebar px-5 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <AtlasBrandLogo compact href={homeHref} />
        <div className="mt-5 rounded-xl border border-border bg-card px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
            {brandLabel}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{subtitle}</p>
        </div>
        <nav
          className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1 lg:flex-1"
          aria-label="Broker workspace navigation"
        >
          {nav.map((item) => {
            const Icon = icons[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-muted-foreground hover:bg-accent-soft/60 hover:text-accent"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="mt-4 lg:mt-auto">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] text-muted hover:bg-card">
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setOpen(true);
                  runSearch(value);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Cerca cliente, richiesta, contratto…"
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-16 text-[13px] outline-none ring-accent/30 focus:ring-2"
                aria-label="Cerca nel Partner Portal"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline">
                ⌘K
              </kbd>
              {open && (query.trim().length >= 2 || paletteOpen) ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-[24rem] overflow-auto rounded-xl border border-border bg-card p-2 shadow-xl">
                  {query.trim().length >= 2 ? (
                    pending ? (
                      <p className="px-3 py-4 text-[12px] text-muted">Ricerca…</p>
                    ) : flatHits.length ? (
                      flatHits.map((hit) => (
                        <button
                          key={`${hit.group}-${hit.id}`}
                          type="button"
                          className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-accent-soft"
                          onClick={() => {
                            setOpen(false);
                            setPaletteOpen(false);
                            setQuery("");
                            router.push(hit.href);
                          }}
                        >
                          <span className="text-[10px] uppercase tracking-wide text-muted">
                            {hit.group}
                          </span>
                          <span className="text-[13px] font-medium">{hit.label}</span>
                          <span className="text-[11px] text-muted">{hit.detail}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-[12px] text-muted">
                        Nessun risultato nel tuo portafoglio.
                      </p>
                    )
                  ) : (
                    COMMANDS.map((command) => (
                      <button
                        key={command.href}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] hover:bg-accent-soft"
                        onClick={() => {
                          setPaletteOpen(false);
                          setOpen(false);
                          router.push(command.href);
                        }}
                      >
                        {command.label}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
