import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Lock, Sparkles, Target } from "lucide-react";
import type { ModuleUnlock } from "@/lib/portfolio-progression";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";

const moduleIcons: Record<ModuleUnlock["id"], ReactNode> = {
  analysis: <Sparkles className="h-4 w-4" />,
  recommendations: <Target className="h-4 w-4" />,
  market: <BarChart3 className="h-4 w-4" />,
};

type ModuleUnlockGridProps = {
  unlocks: ModuleUnlock[];
  title?: string;
};

export function ModuleUnlockGrid({
  unlocks,
  title = "Moduli intelligence",
}: ModuleUnlockGridProps) {
  return (
    <SectionCard
      title={title}
      description="Ogni area si attiva in base allo stato reale del portafoglio."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {unlocks.map((module) => (
          <li
            key={module.id}
            className={cn(
              "flex flex-col rounded-xl border p-4 transition-shadow",
              module.unlocked
                ? "border-border bg-card shadow-sm"
                : "border-dashed border-border bg-card-muted/40"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  module.unlocked
                    ? "bg-accent/10 text-accent"
                    : "bg-muted/20 text-muted"
                )}
              >
                {moduleIcons[module.id]}
              </span>
              {!module.unlocked ? (
                <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              ) : null}
            </div>
            <p className="mt-3 text-[13px] font-semibold text-foreground">
              {module.label}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              {module.unlocked ? module.progressDetail : module.requirement}
            </p>
            {!module.unlocked ? (
              <p className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                {module.progressDetail}
              </p>
            ) : null}
            <Link
              href={module.ctaHref}
              className={cn(
                "mt-3 inline-flex items-center text-[12px] font-medium",
                module.unlocked
                  ? "text-accent hover:underline"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {module.ctaLabel} →
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
