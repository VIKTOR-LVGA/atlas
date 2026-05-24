import {
  IconCar,
  IconHealth,
  IconHome,
  IconLegal,
  IconPolicies,
  IconShield,
} from "@/components/icons";
import type { TypedPolicyType } from "@/lib/types";

export const typedPolicyIconStyles: Record<TypedPolicyType, string> = {
  health:
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  car: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  household:
    "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  liability:
    "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  legal:
    "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  other: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
};

export function TypedPolicyIcon({
  policyType,
  className = "h-5 w-5",
}: {
  policyType: TypedPolicyType;
  className?: string;
}) {
  const icons: Record<TypedPolicyType, React.ReactNode> = {
    health: <IconHealth className={className} />,
    car: <IconCar className={className} />,
    household: <IconHome className={className} />,
    liability: <IconShield className={className} />,
    legal: <IconLegal className={className} />,
    other: <IconPolicies className={className} />,
  };

  return icons[policyType];
}
