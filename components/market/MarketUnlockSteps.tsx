import { CheckCircle2, Circle } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { MarketUnlockStep } from "@/lib/market-intelligence";
import { cn } from "@/lib/utils";

type MarketUnlockStepsProps = {
  steps: MarketUnlockStep[];
};

export function MarketUnlockSteps({ steps }: MarketUnlockStepsProps) {
  return (
    <SectionCard title="Percorso sblocco" padding="sm" tone="support">
      <ol className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-2.5 py-2",
              step.done
                ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                : "border-border-subtle bg-card-muted/40"
            )}
          >
            {step.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success-text)]" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            )}
            <span className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground">{step.label}</p>
              <p className="text-[10px] text-muted">{step.detail}</p>
            </span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
