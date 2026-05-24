"use client";

import { atlasSpace } from "@/lib/atlas-ui";
import { cn } from "@/lib/utils";

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
}

export function RevealStagger({ children, className }: RevealStaggerProps) {
  return (
    <div className={cn("atlas-reveal-stagger", atlasSpace.section, className)}>
      {children}
    </div>
  );
}
