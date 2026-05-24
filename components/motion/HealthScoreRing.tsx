"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

interface HealthScoreRingProps {
  score: number;
  className?: string;
}

function scoreRingColor(score: number) {
  if (score >= 75) {
    return "border-emerald-500/35 text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 50) {
    return "border-amber-500/35 text-amber-600 dark:text-amber-400";
  }
  return "border-red-500/35 text-red-600 dark:text-red-400";
}

export function HealthScoreRing({ score, className }: HealthScoreRingProps) {
  const reducedMotion = useReducedMotion();
  const [animatedScore, setAnimatedScore] = useState(score);
  const previousScore = useRef(score);
  const displayScore = reducedMotion ? score : animatedScore;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const from = previousScore.current;
    previousScore.current = score;

    if (from === score) {
      return;
    }

    const start = performance.now();
    const duration = 560;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (score - from) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setAnimatedScore(score);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, reducedMotion]);

  return (
    <div
      className={cn(
        "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-[3px] bg-card-muted/80 transition-transform duration-300 motion-reduce:transition-none",
        scoreRingColor(score),
        className
      )}
      aria-label={`Score ${score} su 100`}
    >
      <span className="text-[1.375rem] font-semibold tabular-nums">{displayScore}</span>
    </div>
  );
}
