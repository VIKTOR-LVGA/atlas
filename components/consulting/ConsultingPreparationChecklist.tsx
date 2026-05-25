import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { AnimatedProgressBar } from "@/components/motion/AnimatedProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";
import type { ConsultingChecklistItem } from "@/lib/consulting-intelligence";
import { cn } from "@/lib/utils";

type ConsultingPreparationChecklistProps = {
  items: ConsultingChecklistItem[];
};

const statusIcon = {
  done: CheckCircle2,
  partial: CircleDashed,
  pending: Circle,
} as const;

const statusTone = {
  done: "text-[var(--success-text)]",
  partial: "text-[var(--warning-text)]",
  pending: "text-muted",
} as const;

export function ConsultingPreparationChecklist({
  items,
}: ConsultingPreparationChecklistProps) {
  const doneCount = items.filter((item) => item.status === "done").length;

  return (
    <SectionCard
      title="Checklist preparazione dossier"
      description={`${doneCount} di ${items.length} completati · azioni basate sul portafoglio reale`}
      bodyClassName="space-y-2"
    >
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = statusIcon[item.status];

          return (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border px-3 py-3 sm:px-3.5",
                item.status === "done"
                  ? "border-emerald-500/20 bg-emerald-500/[0.04] dark:border-emerald-900/30"
                  : item.status === "partial"
                    ? "border-amber-500/20 bg-amber-500/[0.04] dark:border-amber-900/30"
                    : "border-border-subtle bg-card-muted/40"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Icon
                    className={cn("mt-0.5 h-5 w-5 shrink-0", statusTone[item.status])}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {item.description}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                      {item.progressDetail}
                    </p>
                  </div>
                </div>
                {item.status !== "done" ? (
                  <Link
                    href={item.ctaHref}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent-soft sm:mt-0.5"
                  >
                    {item.ctaLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
              {item.progressPercent !== null && item.status !== "done" ? (
                <div className="mt-2.5 pl-7 sm:pl-0">
                  <AnimatedProgressBar percent={item.progressPercent} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
