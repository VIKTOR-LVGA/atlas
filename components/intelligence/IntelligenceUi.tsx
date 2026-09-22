import Link from "next/link";
import { cn } from "@/lib/utils";

export function IntelligenceShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  const nav = [
    { href: "/intelligence/dashboard", label: "Dashboard" },
    { href: "/intelligence/market", label: "Mercato" },
    { href: "/intelligence/switching", label: "Switching" },
    { href: "/intelligence/premiums", label: "Premi" },
    { href: "/intelligence/coverages", label: "Coperture" },
    { href: "/intelligence/geography", label: "Geografia" },
    { href: "/intelligence/insurers", label: "Compagnie" },
    { href: "/intelligence/reports", label: "Report" },
    { href: "/intelligence/profile", label: "Profilo" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--accent)_8%,transparent),transparent_55%),var(--background)] text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              ATLAS Intelligence
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {subtitle ??
                "Market intelligence sul campione osservato da ATLAS · privacy-first"}
            </p>
          </div>
          <Link
            href="/intelligence"
            className="text-[12px] font-medium text-muted hover:text-accent"
          >
            Info prodotto
          </Link>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="Intelligence navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-accent-soft hover:text-accent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export function IntelligenceEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="text-[15px] font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}

export function IntelligenceMethodNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[11px] leading-relaxed text-muted">
      <span className="font-semibold text-foreground/80">Metodologia: </span>
      {children}
    </p>
  );
}
