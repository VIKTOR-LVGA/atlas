import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence?: number | null;
  uncertain?: boolean | null;
  size?: "sm" | "md";
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  uncertain,
  size = "sm",
  className,
}: ConfidenceBadgeProps) {
  const label =
    confidence === null || confidence === undefined
      ? "Da verificare"
      : `${confidence}%`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        uncertain
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : confidence !== null && confidence !== undefined && confidence >= 80
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-slate-50 text-slate-700",
        className
      )}
    >
      {uncertain ? "Da verificare" : label}
    </span>
  );
}
