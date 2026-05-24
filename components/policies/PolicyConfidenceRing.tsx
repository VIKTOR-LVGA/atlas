import { cn } from "@/lib/utils";

interface PolicyConfidenceRingProps {
  confidence: number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

function ringColor(confidence: number) {
  if (confidence >= 75) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (confidence >= 50) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-red-600 dark:text-red-400";
}

export function PolicyConfidenceRing({
  confidence,
  size = "sm",
  className,
}: PolicyConfidenceRingProps) {
  if (confidence === null || confidence === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-dashed border-border text-muted",
          size === "sm" ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-[11px]",
          className
        )}
        title="Confidenza non disponibile"
      >
        N/D
      </span>
    );
  }

  const dimension = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const fontSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border-[2.5px] bg-card-muted/60 font-semibold tabular-nums",
        dimension,
        fontSize,
        ringColor(confidence),
        className
      )}
      title={`Confidenza estrazione ${confidence}%`}
    >
      {Math.round(confidence)}
    </span>
  );
}
