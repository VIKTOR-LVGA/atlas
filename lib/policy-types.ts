import type {
  PolicyDetails,
  PolicyDetailValue,
  TypedPolicyType,
} from "@/lib/types";
import { formatCHF } from "@/lib/utils";

export const typedPolicyTypes = [
  "health",
  "liability",
  "household",
  "car",
  "legal",
  "other",
] as const;

export const policyTypeLabels: Record<TypedPolicyType, string> = {
  health: "Cassa malati",
  liability: "RC privata",
  household: "Economia domestica",
  car: "Auto",
  legal: "Protezione giuridica",
  other: "Altro",
};

const policyDetailKeys: Record<TypedPolicyType, Array<keyof PolicyDetails>> = {
  health: ["franchise", "model", "complementary", "hospital_coverage"],
  liability: ["liability_limit", "household_members_included"],
  household: ["insured_sum", "glass_coverage", "theft_coverage"],
  car: ["plate_number", "casco", "bonus_malus", "annual_km"],
  legal: ["private_legal", "traffic_legal", "coverage_region"],
  other: ["generic_details"],
};

const detailLabels: Record<keyof PolicyDetails, string> = {
  franchise: "Franchise",
  model: "Modello",
  complementary: "Complementare",
  hospital_coverage: "Copertura ospedaliera",
  plate_number: "Targa",
  casco: "Casco",
  bonus_malus: "Bonus malus",
  annual_km: "Km annui",
  insured_sum: "Somma assicurata",
  glass_coverage: "Copertura vetri",
  theft_coverage: "Copertura furto",
  liability_limit: "Limite RC",
  household_members_included: "Membri inclusi",
  private_legal: "Giuridica privata",
  traffic_legal: "Giuridica traffico",
  coverage_region: "Regione coperta",
  generic_details: "Dettagli",
};

const moneyDetailKeys = new Set<keyof PolicyDetails>([
  "franchise",
  "insured_sum",
  "liability_limit",
]);

function isPolicyDetailValue(value: unknown): value is PolicyDetailValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function hasDisplayValue(
  value: PolicyDetailValue | undefined
): value is PolicyDetailValue {
  return value !== undefined && value !== null && value !== "";
}

function stringifyDetail(key: keyof PolicyDetails, value: PolicyDetailValue) {
  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "number") {
    if (moneyDetailKeys.has(key)) {
      return formatCHF(value);
    }

    if (key === "annual_km") {
      return `${new Intl.NumberFormat("it-CH").format(value)} km`;
    }

    return new Intl.NumberFormat("it-CH").format(value);
  }

  return value;
}

export function isTypedPolicyType(value: string): value is TypedPolicyType {
  return typedPolicyTypes.includes(value as TypedPolicyType);
}

export function toTypedPolicyType(value: string | null | undefined): TypedPolicyType {
  if (!value) {
    return "other";
  }

  const normalizedValue = value.toLowerCase();

  if (isTypedPolicyType(normalizedValue)) {
    return normalizedValue;
  }

  if (/(cassa|malat|salut|health|helsana)/.test(normalizedValue)) {
    return "health";
  }

  if (/(rc privata|responsabil|liability)/.test(normalizedValue)) {
    return "liability";
  }

  if (/(economia|domestic|mobilia|household|casa)/.test(normalizedValue)) {
    return "household";
  }

  if (/(auto|casco|car|veicol|vehicle)/.test(normalizedValue)) {
    return "car";
  }

  if (/(giurid|legal|recht)/.test(normalizedValue)) {
    return "legal";
  }

  return "other";
}

export function getPolicyTypeLabel(
  policyType: TypedPolicyType,
  categoryLabel?: string | null
) {
  if (policyType === "other" && categoryLabel?.trim()) {
    return categoryLabel.trim();
  }

  return policyTypeLabels[policyType];
}

export function sanitizePolicyDetails(
  policyType: TypedPolicyType,
  details: unknown
): PolicyDetails {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  const source = details as Record<string, unknown>;

  return policyDetailKeys[policyType].reduce<PolicyDetails>((result, key) => {
    const value = source[key];

    if (isPolicyDetailValue(value)) {
      result[key] = value as never;
    }

    return result;
  }, {});
}

export function getPolicyDetailRows(
  policyType: TypedPolicyType,
  details: PolicyDetails
) {
  return policyDetailKeys[policyType]
    .map((key) => {
      const value = details[key];

      if (!hasDisplayValue(value)) {
        return null;
      }

      return {
        key,
        label: detailLabels[key],
        value: stringifyDetail(key, value),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export function getPolicyDetailSummary(
  policyType: TypedPolicyType,
  details: PolicyDetails
) {
  const rows = getPolicyDetailRows(policyType, details);

  return rows
    .slice(0, 2)
    .map((row) => `${row.label}: ${row.value}`)
    .join(" / ");
}
