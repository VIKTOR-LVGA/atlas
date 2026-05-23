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
          ? "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]"
          : confidence !== null && confidence !== undefined && confidence >= 80
            ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
            : "border-border bg-card-muted text-muted-foreground",
        className
      )}
    >
      {uncertain ? "Da verificare" : label}
    </span>
  );
}
