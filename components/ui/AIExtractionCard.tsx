import { Sparkles } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/utils";

interface AIExtractionCardProps {
  confidence: number | null;
  notes?: string | null;
  uncertainCount?: number;
  className?: string;
}

export function AIExtractionCard({
  confidence,
  notes,
  uncertainCount = 0,
  className,
}: AIExtractionCardProps) {
  const width = Math.max(8, Math.min(100, confidence ?? 72));

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-foreground">Estrazione AI</p>
          <p className="text-[11px] text-muted">Normalizzazione svizzera</p>
        </div>
        <ConfidenceBadge
          confidence={confidence}
          uncertain={confidence === null || confidence < 75}
          size="md"
        />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-muted">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      {notes ? (
        <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-muted">
          {notes}
        </p>
      ) : null}
      {uncertainCount > 0 ? (
        <p className="mt-2 text-[11px] text-amber-700">
          {uncertainCount} campi da confermare manualmente.
        </p>
      ) : null}
    </div>
  );
}
