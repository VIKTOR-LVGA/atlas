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
        "atlas-card-support atlas-surface-card-interactive flex flex-col p-3.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent ring-1 ring-accent/10">
          {icon}
        </span>
        <StatusBadge variant={statusVariant} label={statusLabel} />
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-snug text-foreground">
        {title}
      </p>
      <p className="mt-0.5 flex-1 text-[11px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="mt-2 text-[11px] font-medium text-accent hover:text-accent-hover"
        >
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  );
}
