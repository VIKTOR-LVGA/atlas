import { Check, Circle, CircleDashed, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { PolicyTimelineStep } from "@/lib/policy-detail-display";
import { cn } from "@/lib/utils";

interface PolicyStructureTimelineProps {
  steps: PolicyTimelineStep[];
}

export function PolicyStructureTimeline({ steps }: PolicyStructureTimelineProps) {
  return (
    <SectionCard
      title="Struttura polizza"
      description="Percorso documento → estrazione → revisione"
      padding="sm"
      bodyClassName="space-y-0"
    >
      <ol className="relative space-y-0">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "relative flex gap-3 pb-4 last:pb-0",
              index < steps.length - 1 &&
                "before:absolute before:left-[13px] before:top-7 before:h-[calc(100%-12px)] before:w-px before:bg-border"
            )}
          >
            <StepIndicator state={step.state} />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[12px] font-semibold text-foreground">{step.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function StepIndicator({ state }: { state: PolicyTimelineStep["state"] }) {
  if (state === "complete") {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)] ring-2 ring-card">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-2 ring-card">
        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      </span>
    );
  }

  if (state === "pending") {
    return (
      <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted ring-2 ring-card">
        <Circle className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-card-muted text-muted ring-2 ring-card">
      <CircleDashed className="h-3.5 w-3.5" />
    </span>
  );
}
