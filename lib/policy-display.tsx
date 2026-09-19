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
  travel: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  life: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  pension:
    "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
  building:
    "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  pet: "bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
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
    travel: <IconPolicies className={className} />,
    life: <IconPolicies className={className} />,
    pension: <IconPolicies className={className} />,
    building: <IconHome className={className} />,
    pet: <IconPolicies className={className} />,
    other: <IconPolicies className={className} />,
  };

  return icons[policyType];
}
