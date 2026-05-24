import { cn } from "@/lib/utils";

type PastelVariant = "blue" | "green" | "yellow" | "purple" | "red" | "indigo";

const iconBg: Record<PastelVariant, string> = {
  blue: "bg-accent-soft text-accent ring-1 ring-accent/15",
  green:
    "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/15 dark:text-emerald-400",
  yellow:
    "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/15 dark:text-amber-400",
  purple:
    "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/15 dark:text-violet-400",
  red: "bg-red-500/10 text-red-600 ring-1 ring-red-500/15 dark:text-red-400",
  indigo: "bg-indigo-500/10 text-accent ring-1 ring-indigo-500/15 dark:text-indigo-400",
};

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  subtextLink?: string;
  icon: React.ReactNode;
  variant?: PastelVariant;
  badge?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  unavailableValue?: boolean;
}

export function StatCard({
  label,
  value,
  subtext,
  subtextLink,
  icon,
  variant = "blue",
  badge,
  className,
  valueClassName,
  unavailableValue = false,
}: StatCardProps) {
  return (
    <div className={cn("atlas-kpi-card atlas-surface-card-interactive p-3", className)}>
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
            iconBg[variant]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
              {label}
            </p>
            {badge}
          </div>
          <p
            className={cn(
              "mt-0.5 tabular-nums tracking-tight text-foreground",
              unavailableValue
                ? "text-[13px] font-medium text-muted"
                : "text-[1.125rem] font-semibold leading-tight",
              valueClassName
            )}
          >
            {value}
          </p>
          {subtext ? (
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-[10px] leading-snug",
                subtextLink ? "font-medium text-accent" : "text-muted-foreground"
              )}
            >
              {subtext}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
