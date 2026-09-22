import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PartnerEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card-muted/20 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-accent">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-4 text-[14px] font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
        {description}
      </p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-[12px] font-medium text-accent transition hover:border-accent"
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
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
