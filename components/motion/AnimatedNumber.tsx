"use client";

import { useEffect, useRef, useState } from "react";
import { formatAnimatedNumber, parseDisplayNumber } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

interface AnimatedNumberProps {
  value: string;
  className?: string;
  /** Only animates when value changes after mount — avoids hydration flash. */
  animateOnMount?: boolean;
  durationMs?: number;
}

export function AnimatedNumber({
  value,
  className,
  animateOnMount = false,
  durationMs = 520,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const hasMounted = useRef(false);
  const previousValue = useRef(value);

  useEffect(() => {
    const shouldAnimate =
      !reducedMotion &&
      (animateOnMount || hasMounted.current) &&
      parseDisplayNumber(value) !== null;

    if (!hasMounted.current) {
      hasMounted.current = true;
    }

    if (!shouldAnimate) {
      setDisplay(value);
      previousValue.current = value;
      return;
    }

    const target = parseDisplayNumber(value)!;
    const from = parseDisplayNumber(previousValue.current) ?? 0;
    previousValue.current = value;

    if (from === target) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setDisplay(formatAnimatedNumber(value, current));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion, animateOnMount, durationMs]);

  return <span className={cn("tabular-nums", className)}>{display}</span>;
}
