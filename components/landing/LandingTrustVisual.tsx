import Image from "next/image";
import { cn } from "@/lib/utils";

type LandingTrustVisualProps = {
  className?: string;
};

const MAP_WIDTH = 1024;
const MAP_HEIGHT = 682;

/** Switzerland map — trust section only; no container, native page blend */
export function LandingTrustVisual({ className }: LandingTrustVisualProps) {
  return (
    <div className={cn("landing-trust-visual", className)}>
      <Image
        src="/brand/atlas-trust-switzerland.png"
        alt=""
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="landing-trust-visual-img"
        sizes="(max-width: 1024px) 72vw, 360px"
        priority
      />
    </div>
  );
}
