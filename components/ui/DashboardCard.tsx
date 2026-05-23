import { cn } from "@/lib/utils";

interface DashboardCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: string; positive?: boolean };
  icon?: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function DashboardCard({
  label,
  value,
  subtext,
  trend,
  icon,
  className,
  highlight,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]",
        highlight && "border-border/60 bg-gradient-to-br from-card to-accent-soft/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-muted text-muted">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      {(subtext || trend) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {subtext && <p className="text-xs text-muted">{subtext}</p>}
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
