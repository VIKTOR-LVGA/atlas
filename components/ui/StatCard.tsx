import { cn } from "@/lib/utils";

type PastelVariant = "blue" | "green" | "yellow" | "purple" | "red" | "indigo";

const iconBg: Record<PastelVariant, string> = {
  blue: "bg-accent-soft text-accent",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  indigo: "bg-indigo-500/10 text-accent dark:text-indigo-400",
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
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[108px] flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconBg[variant]
          )}
        >
          {icon}
        </div>
        {badge}
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      {subtext && (
        <p className={cn("mt-1 text-[11px]", subtextLink ? "text-accent" : "text-muted")}>
          {subtext}
        </p>
      )}
    </div>
  );
}
