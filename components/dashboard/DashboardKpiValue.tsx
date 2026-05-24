import { cn } from "@/lib/utils";

interface DashboardKpiValueProps {
  value: string;
  unavailable?: boolean;
  className?: string;
}

export function formatKpiValue(
  value: number | null | undefined,
  formatter: (amount: number) => string
): { display: string; unavailable: boolean } {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { display: "Non disponibile", unavailable: true };
  }

  return { display: formatter(value), unavailable: false };
}

export function DashboardKpiValue({
  value,
  unavailable,
  className,
}: DashboardKpiValueProps) {
  return (
    <span
      className={cn(
        "tabular-nums tracking-tight",
        unavailable
          ? "text-[13px] font-medium text-muted"
          : "text-[1.125rem] font-semibold leading-tight text-foreground",
        className
      )}
    >
      {value}
    </span>
  );
}
