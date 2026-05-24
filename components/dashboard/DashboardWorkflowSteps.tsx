import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardWorkflowStep } from "@/lib/dashboard-intelligence";

interface DashboardWorkflowStepsProps {
  steps: DashboardWorkflowStep[];
}

export function DashboardWorkflowSteps({ steps }: DashboardWorkflowStepsProps) {
  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li key={step.id} className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                step.status === "done" &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                step.status === "current" &&
                  "border-accent/35 bg-accent-soft text-accent shadow-[0_0_0_3px_var(--accent-soft)]",
                step.status === "upcoming" &&
                  "border-border bg-card-muted text-muted"
              )}
            >
              {step.status === "done" ? (
                <Check className="h-3 w-3" aria-hidden />
              ) : (
                index + 1
              )}
            </span>
            {index < steps.length - 1 ? (
              <span className="mt-0.5 h-full min-h-3 w-px bg-border-subtle" aria-hidden />
            ) : null}
          </div>
          <div className="min-w-0 pb-0.5 pt-px">
            <p
              className={cn(
                "text-[12px] font-medium leading-tight",
                step.status === "upcoming" ? "text-muted" : "text-foreground"
              )}
            >
              {step.label}
            </p>
            <p className="mt-px text-[10px] leading-snug text-muted-foreground">
              {step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
