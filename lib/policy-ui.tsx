import type { PolicyCategory } from "./types";
import {
  IconCar,
  IconHealth,
  IconHome,
  IconLegal,
  IconLife,
  IconShield,
} from "@/components/icons";

export const categoryIconBg: Record<PolicyCategory, string> = {
  car: "bg-blue-50 text-blue-600",
  health: "bg-emerald-50 text-emerald-600",
  household: "bg-amber-50 text-amber-600",
  liability: "bg-violet-50 text-violet-600",
  legal: "bg-indigo-50 text-indigo-600",
  life: "bg-rose-50 text-rose-600",
};

export function PolicyCategoryIcon({
  category,
  className = "h-[18px] w-[18px]",
}: {
  category: PolicyCategory;
  className?: string;
}) {
  const icons: Record<PolicyCategory, React.ReactNode> = {
    car: <IconCar className={className} />,
    health: <IconHealth className={className} />,
    household: <IconHome className={className} />,
    liability: <IconShield className={className} />,
    legal: <IconLegal className={className} />,
    life: <IconLife className={className} />,
  };
  return icons[category];
}

export function ScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-slate-800">{score}</span>
    </div>
  );
}
