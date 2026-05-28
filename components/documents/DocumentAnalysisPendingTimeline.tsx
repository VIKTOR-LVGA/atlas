"use client";

import { useEffect, useState } from "react";
import {
  ANALYSIS_FINALIZATION_MESSAGES,
  ANALYSIS_PROCESSING_STEPS,
  DocumentAnalysisTimeline,
} from "@/components/documents/DocumentAnalysisTimeline";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

/** ~27s through steps 0–5; finalization continues calmly if backend is slower. */
const STEP_INTERVAL_MS = 4500;
const FINALIZATION_ROTATION_MS = 3800;
const FINAL_STEP_INDEX = ANALYSIS_PROCESSING_STEPS.length - 1;

type DocumentAnalysisPendingTimelineProps = {
  compact?: boolean;
  className?: string;
};

/**
 * Mounted only while analysis is pending — state resets on unmount.
 * Visual progression only; does not reflect real backend stage completion.
 */
export function DocumentAnalysisPendingTimeline({
  compact = false,
  className,
}: DocumentAnalysisPendingTimelineProps) {
  const reducedMotion = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [awaitingCompletion, setAwaitingCompletion] = useState(false);
  const [finalizationIndex, setFinalizationIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timeoutIds: number[] = [];

    for (let step = 1; step <= FINAL_STEP_INDEX; step += 1) {
      timeoutIds.push(
        window.setTimeout(() => {
          setActiveStepIndex(step);
        }, STEP_INTERVAL_MS * step)
      );
    }

    timeoutIds.push(
      window.setTimeout(() => {
        setAwaitingCompletion(true);
      }, STEP_INTERVAL_MS * (FINAL_STEP_INDEX + 1))
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!awaitingCompletion || reducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFinalizationIndex(
        (current) => (current + 1) % ANALYSIS_FINALIZATION_MESSAGES.length
      );
    }, FINALIZATION_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [awaitingCompletion, reducedMotion]);

  const visualStep = reducedMotion ? FINAL_STEP_INDEX : activeStepIndex;
  const visualAwaiting = reducedMotion || awaitingCompletion;
  const finalizationMessage = ANALYSIS_FINALIZATION_MESSAGES[finalizationIndex];

  return (
    <DocumentAnalysisTimeline
      activeStepIndex={visualStep}
      compact={compact}
      className={className}
      awaitingCompletion={visualAwaiting}
      finalizationMessage={finalizationMessage}
    />
  );
}
