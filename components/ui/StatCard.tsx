import { cn } from "@/lib/utils";

type PastelVariant = "blue" | "green" | "yellow" | "purple" | "red" | "indigo";

const iconBg: Record<PastelVariant, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  purple: "bg-violet-50 text-violet-600",
  red: "bg-red-50 text-red-600",
  indigo: "bg-indigo-50 text-indigo-600",
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
        "flex h-full min-h-[108px] flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg[variant])}>
          {icon}
        </div>
        {badge}
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      {subtext && (
        <p className={cn("mt-1 text-[11px]", subtextLink ? "text-blue-600" : "text-slate-500")}>
          {subtext}
        </p>
      )}
    </div>
  );
}
