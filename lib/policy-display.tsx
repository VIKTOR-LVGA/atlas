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
  health: "bg-emerald-50 text-emerald-600",
  car: "bg-blue-50 text-blue-600",
  household: "bg-amber-50 text-amber-600",
  liability: "bg-violet-50 text-violet-600",
  legal: "bg-indigo-50 text-indigo-600",
  other: "bg-slate-100 text-slate-600",
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
