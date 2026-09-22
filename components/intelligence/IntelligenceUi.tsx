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
    { href: "/intelligence/methodology", label: "Metodologia" },
    { href: "/intelligence/profile", label: "Profilo" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--accent)_8%,transparent),transparent_55%),linear-gradient(180deg,color-mix(in_srgb,var(--background)_92%,#0b1f2a)_0%,var(--background)_40%)] text-foreground">
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
  meta,
}: {
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center shadow-[inset_0_1px_0_color-mix(in_srgb,white_6%,transparent)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Campione ATLAS
      </p>
      <p className="mt-3 text-[18px] font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
        {description}
      </p>
      {meta ? (
        <p className="mx-auto mt-4 max-w-md text-[11px] text-muted/90">{meta}</p>
      ) : null}
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

export function IntelligenceContextBar({
  period,
  lastUpdated,
  sampleLabel = "Campione ATLAS",
}: {
  period?: string | null;
  lastUpdated?: string | null;
  sampleLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-card/70 px-4 py-2.5 text-[11px] text-muted">
      <span>
        <span className="font-semibold text-foreground/80">{sampleLabel}</span>
      </span>
      {period ? <span>Periodo: {period}</span> : null}
      <span>
        Ultimo aggiornamento:{" "}
        {lastUpdated
          ? new Date(lastUpdated).toLocaleString("it-CH", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "non ancora calcolato"}
      </span>
    </div>
  );
}

export function IntelligenceKpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1.5 text-[22px] font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-muted">{detail}</p> : null}
    </div>
  );
}

export function IntelligenceDataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: Array<Array<string>>;
  empty: React.ReactNode;
}) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-[12px]">
        <thead className="border-b border-border bg-card/80 text-[11px] uppercase tracking-wide text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/70 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
