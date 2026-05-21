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
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50",
        highlight && "border-blue-200/60 bg-gradient-to-br from-white to-blue-50/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>
      {(subtext || trend) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
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
