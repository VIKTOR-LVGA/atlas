import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge";

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  statusLabel: string;
  statusVariant?: StatusBadgeVariant;
  href?: string;
  hrefLabel?: string;
  className?: string;
}

export function InsightCard({
  icon,
  title,
  description,
  statusLabel,
  statusVariant = "neutral",
  href,
  hrefLabel,
  className,
}: InsightCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card-muted text-muted">
          {icon}
        </span>
        <StatusBadge variant={statusVariant} label={statusLabel} />
      </div>
      <p className="mt-3 text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted">
        {description}
      </p>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="mt-3 text-[12px] font-medium text-accent hover:text-accent"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
