"use client";

import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { cn } from "@/lib/utils";

interface MetricAnimatedValueProps {
  value: string;
  unavailable?: boolean;
  className?: string;
}

export function MetricAnimatedValue({
  value,
  unavailable = false,
  className,
}: MetricAnimatedValueProps) {
  if (unavailable) {
    return (
      <span className={cn("text-[13px] font-medium text-muted", className)}>
        {value}
      </span>
    );
  }

  return (
    <AnimatedNumber
      value={value}
      className={cn(
        "text-[1.125rem] font-semibold leading-tight text-foreground",
        className
      )}
    />
  );
}
