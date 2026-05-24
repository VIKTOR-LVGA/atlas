import { cn } from "@/lib/utils";
import { atlasSpace } from "@/lib/atlas-ui";

type PolicyRevealGroupProps = {
  children: React.ReactNode;
  className?: string;
};

/** Staggered reveal wrapper for extraction sections (respects reduced motion via CSS). */
export function PolicyRevealGroup({ children, className }: PolicyRevealGroupProps) {
  return (
    <div className={cn("atlas-reveal-group", atlasSpace.block, className)}>{children}</div>
  );
}
