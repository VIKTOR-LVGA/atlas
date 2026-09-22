import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PartnerAreaIcon, type PartnerAreaKey } from "@/components/partner/PartnerVisuals";

export function PartnerEmptyState({
  icon: Icon,
  area,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  area?: PartnerAreaKey;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_6%,transparent),transparent)] px-6 py-10 text-center">
      {area ? (
        <PartnerAreaIcon area={area} size="lg" />
      ) : Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-accent shadow-sm">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <p className="mt-4 text-[14px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-accent transition hover:border-accent/50"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function PartnerBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        tone === "neutral" && "bg-card-muted text-muted",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "success" && "bg-emerald-500/15 text-emerald-300",
        tone === "warn" && "bg-amber-500/15 text-amber-200",
        tone === "danger" && "bg-rose-500/15 text-rose-300"
      )}
    >
      {children}
    </span>
  );
}

export function PartnerPageIntro({
  area,
  eyebrow,
  title,
  description,
  actions,
}: {
  area: PartnerAreaKey;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-5">
      <div className="flex min-w-0 items-start gap-3">
        <PartnerAreaIcon area={area} size="lg" />
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-0.5 text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
