import type { TypedPolicyType, UserPolicy } from "@/lib/types";

export type VisualPolicyCategoryId =
  | "health"
  | "car"
  | "liability"
  | "household"
  | "legal"
  | "travel"
  | "life"
  | "pension"
  | "pets"
  | "other";

export type VisualPolicyCategory = {
  id: VisualPolicyCategoryId;
  typedType: TypedPolicyType;
  label: string;
  categoryLabel: string | null;
  hint: string;
};

export const visualPolicyCategories: VisualPolicyCategory[] = [
  {
    id: "health",
    typedType: "health",
    label: "Cassa malati",
    categoryLabel: null,
    hint: "LAMal e complementari",
  },
  {
    id: "car",
    typedType: "car",
    label: "Auto",
    categoryLabel: null,
    hint: "RC, casco, assistenza",
  },
  {
    id: "liability",
    typedType: "liability",
    label: "RC privata",
    categoryLabel: null,
    hint: "Responsabilità civile",
  },
  {
    id: "household",
    typedType: "household",
    label: "Mobilia domestica",
    categoryLabel: null,
    hint: "Casa e contenuto",
  },
  {
    id: "legal",
    typedType: "legal",
    label: "Protezione giuridica",
    categoryLabel: null,
    hint: "Controversie e assistenza",
  },
  {
    id: "travel",
    typedType: "other",
    label: "Viaggi",
    categoryLabel: "Viaggi",
    hint: "Viaggio e assistenza",
  },
  {
    id: "life",
    typedType: "other",
    label: "Vita",
    categoryLabel: "Vita",
    hint: "Copertura vita",
  },
  {
    id: "pension",
    typedType: "other",
    label: "Previdenza",
    categoryLabel: "Previdenza",
    hint: "3° pilastro e previdenza",
  },
  {
    id: "pets",
    typedType: "other",
    label: "Animali",
    categoryLabel: "Animali",
    hint: "Cane, gatto e altri",
  },
  {
    id: "other",
    typedType: "other",
    label: "Altre",
    categoryLabel: null,
    hint: "Tutto il resto",
  },
];

const extraLabelToId: Record<string, VisualPolicyCategoryId> = {
  viaggi: "travel",
  viaggio: "travel",
  travel: "travel",
  vita: "life",
  life: "life",
  previdenza: "pension",
  pension: "pension",
  "3 pilastro": "pension",
  animali: "pets",
  pets: "pets",
};

export function getVisualCategory(
  policyType: TypedPolicyType,
  categoryLabel?: string | null
): VisualPolicyCategory {
  if (policyType !== "other") {
    return (
      visualPolicyCategories.find((item) => item.typedType === policyType) ??
      visualPolicyCategories[visualPolicyCategories.length - 1]
    );
  }

  const key = categoryLabel?.trim().toLowerCase() ?? "";
  const extraId = extraLabelToId[key];
  if (extraId) {
    return visualPolicyCategories.find((item) => item.id === extraId)!;
  }

  return visualPolicyCategories.find((item) => item.id === "other")!;
}

export function getVisualCategoryForPolicy(policy: UserPolicy) {
  return getVisualCategory(policy.policyType, policy.policyCategoryLabel);
}

export function groupPoliciesByVisualCategory(policies: UserPolicy[]) {
  const groups = visualPolicyCategories.map((category) => ({
    category,
    policies: policies.filter(
      (policy) => getVisualCategoryForPolicy(policy).id === category.id
    ),
  }));

  return groups.filter((group) => group.policies.length > 0);
}
