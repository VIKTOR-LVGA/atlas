import Link from "next/link";
import { AlertTriangle, ChevronRight, Info } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  AtlasRecommendation,
  RecommendationPriority,
} from "@/lib/recommendations-intelligence";
import { cn } from "@/lib/utils";

const priorityVariant: Record<
  RecommendationPriority,
  "high" | "medium" | "low"
> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const priorityLabel: Record<RecommendationPriority, string> = {
  high: "Alta priorità",
  medium: "Media priorità",
  low: "Bassa priorità",
};

const iconStyles: Record<RecommendationPriority, string> = {
  high: "bg-[var(--danger-bg)] text-[var(--danger-text)] ring-1 ring-[var(--danger-border)]",
  medium:
    "bg-[var(--warning-bg)] text-[var(--warning-text)] ring-1 ring-[var(--warning-border)]",
  low: "bg-card-muted text-muted ring-1 ring-border",
};

interface RecommendationCardProps {
  recommendation: AtlasRecommendation;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  compact = false,
}: RecommendationCardProps) {
  const Icon = recommendation.priority === "low" ? Info : AlertTriangle;

  return (
    <Link
      href={recommendation.ctaHref}
      className={cn(
        "atlas-row-interactive group flex items-start gap-3 rounded-lg border border-border-subtle bg-card/80 transition",
        compact ? "p-2.5" : "p-3"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[10px]",
          compact ? "h-8 w-8" : "h-9 w-9",
          iconStyles[recommendation.priority]
        )}
      >
        <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-[12px]" : "text-[13px]"
            )}
          >
            {recommendation.title}
          </span>
          <StatusBadge
            variant={priorityVariant[recommendation.priority]}
            label={priorityLabel[recommendation.priority]}
          />
        </span>
        <span className="mt-1 block text-[11px] leading-relaxed text-muted">
          {recommendation.explanation}
        </span>
        {recommendation.affectedLabel ? (
          <span className="mt-1.5 inline-block text-[10px] font-medium text-accent">
            {recommendation.affectedLabel}
          </span>
        ) : null}
      </span>
      <span className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
        <span className="text-[10px] font-medium text-accent">
          {recommendation.ctaLabel}
        </span>
        <ChevronRight className="atlas-link-chevron h-4 w-4 text-muted group-hover:text-accent" />
      </span>
    </Link>
  );
}
