import type { PolicyCategory } from "./types";
import {
  IconBuilding,
  IconCar,
  IconHealth,
  IconHome,
  IconLegal,
  IconLife,
  IconPension,
  IconPet,
  IconShield,
  IconTravel,
} from "@/components/icons";

export const categoryIconBg: Record<PolicyCategory, string> = {
  car: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  health: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  household: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  liability: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  legal: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  travel: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  life: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  pension: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
  building: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  pet: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
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
    travel: <IconTravel className={className} />,
    life: <IconLife className={className} />,
    pension: <IconPension className={className} />,
    building: <IconBuilding className={className} />,
    pet: <IconPet className={className} />,
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
