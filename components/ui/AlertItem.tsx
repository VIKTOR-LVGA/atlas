import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconChevronRight } from "@/components/icons";
import type { AlertSeverity } from "@/lib/types";

const iconBg: Record<AlertSeverity, string> = {
  high: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  medium: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  low: "bg-card-muted text-muted",
  info: "bg-accent-soft text-accent",
};

interface AlertItemProps {
  title: string;
  description: string;
  severity: AlertSeverity;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AlertItem({
  title,
  description,
  severity,
  href,
  icon,
  className,
}: AlertItemProps) {
  const content = (
    <>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          iconBg[severity]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <IconChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </>
  );

  const baseClass = cn(
    "flex items-center gap-3 rounded-xl px-1 py-2.5 transition hover:bg-card-muted",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
