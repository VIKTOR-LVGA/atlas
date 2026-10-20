import { cn } from "@/lib/utils";

type AtlasBrandMarkProps = {
  className?: string;
};

/** Gradient “A” mark — matches ATLAS AI INSURANCE lockup accent */
export function AtlasBrandMark({ className }: AtlasBrandMarkProps) {
  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="atlas-mark-peak"
          x1="20"
          y1="4"
          x2="20"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient
          id="atlas-mark-arc"
          x1="8"
          y1="28"
          x2="32"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <filter
          id="atlas-mark-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#atlas-mark-glow)">
        <path
          d="M20 6L31 24H26.2L24.2 20.5H15.8L13.8 24H9L20 6Z"
          fill="url(#atlas-mark-peak)"
        />
        <path
          d="M11 29.5C14.5 26.5 25.5 26.5 29 29.5"
          stroke="url(#atlas-mark-arc)"
          strokeWidth="3.25"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
