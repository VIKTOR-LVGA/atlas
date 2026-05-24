"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

interface AnimatedProgressBarProps {
  percent: number;
  className?: string;
  barClassName?: string;
}

export function AnimatedProgressBar({
  percent,
  className,
  barClassName = "bg-accent/70",
}: AnimatedProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const [animatedWidth, setAnimatedWidth] = useState(percent);
  const width = reducedMotion ? percent : animatedWidth;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const frame = requestAnimationFrame(() => setAnimatedWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent, reducedMotion]);

  return (
    <div
      className={cn(
        "h-1.5 overflow-hidden rounded-full bg-card-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
          barClassName
        )}
        style={{ width: `${Math.max(0, Math.min(100, width))}%` }}
      />
    </div>
  );
}
