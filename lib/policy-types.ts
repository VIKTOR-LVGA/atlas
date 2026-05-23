import {
  buildCoverageStableKey,
  buildPersonStableKey,
} from "@/lib/coverage-stable-keys";
import { inferInsuredPeopleFromDetails } from "@/lib/policy-health-grouping";
import type {
  PolicyBaseInsuranceDetail,
  PolicyCoverageDetail,
  PolicyCoverageDiscount,
  PolicyDetails,
  PolicyDetailValue,
  PolicyExtractionMetadata,
  PolicyFieldConfidence,
  PolicyFieldConfidenceKey,
  PolicyFieldConfidenceMap,
  PolicyInsuredPersonDetail,
  PolicyPremiumFrequency,
  PolicyPremiumSummaryDetail,
  PolicyProductDetail,
  TypedPolicyType,
} from "@/lib/types";
import {
  isSwissPolicySubtype,
  swissPolicySubtypeLabels,
} from "@/lib/swiss-insurance-normalization";
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

const sharedPolicyDetailKeys = [
  "coverage_kind",
  "coverages",
  "insured_people",
  "products",
  "field_confidence",
  "extraction_metadata",
] as const satisfies Array<keyof PolicyDetails>;

const policyDetailKeys: Record<TypedPolicyType, Array<keyof PolicyDetails>> = {
  health: [
    "coverage_kind",
    "franchise",
    "deductible",
    "model",
    "complementary",
    "hospital_coverage",
    "accident_covered",
    "telemedicine",
    "family_doctor_model",
    "base_insurance",
    "travel_coverage",
    "legal_protection",
    "premium_summary",
    "collective_contract",
    "canton_or_premium_region",
    "cancellation_deadline",
    "complementary_products",
    "insured_people",
    "coverages",
    "field_confidence",
    "extraction_metadata",
  ],
  liability: ["liability_limit", "household_members_included"],
  household: ["insured_sum", "glass_coverage", "theft_coverage"],
  car: ["plate_number", "casco", "bonus_malus", "annual_km"],
  legal: ["private_legal", "traffic_legal", "coverage_region"],
  other: ["generic_details"],
};

const detailLabels: Record<keyof PolicyDetails, string> = {
  coverage_kind: "Tipo copertura",
  franchise: "Franchise",
  deductible: "Scoperto",
  model: "Modello",
  complementary: "Complementare",
  hospital_coverage: "Copertura ospedaliera",
  accident_covered: "Infortunio incluso",
  telemedicine: "Telemedicina",
  family_doctor_model: "Medico di famiglia",
  base_insurance: "Assicurazione base",
  travel_coverage: "Copertura viaggio",
  legal_protection: "Protezione giuridica",
  premium_summary: "Riepilogo premi",
  collective_contract: "Contratto collettivo",
  canton_or_premium_region: "Cantone / regione premio",
  cancellation_deadline: "Termine disdetta",
  complementary_products: "Prodotti complementari",
  insured_people: "Persone assicurate",
  coverages: "Coperture rilevate",
  products: "Prodotti rilevati",
  field_confidence: "Confidenza campi",
  extraction_metadata: "Metadati estrazione",
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
  "deductible",
  "insured_sum",
  "liability_limit",
]);

const fieldConfidenceLabels: Record<PolicyFieldConfidenceKey, string> = {
  provider: "Compagnia",
  policy_type: "Tipo polizza",
  policy_number: "Numero polizza",
  premium_amount: "Premio",
  premium_frequency: "Frequenza premio",
  deductible: "Franchigia",
  start_date: "Data inizio",
  end_date: "Data fine",
  renewal_date: "Data rinnovo",
  currency: "Valuta",
  coverage_amount: "Somma copertura",
  details: "Dettagli",
};

function isPolicyDetailScalar(value: unknown) {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function normalizeNullableText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeNullableBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeConfidence(value: unknown) {
  const confidence = normalizeNullableNumber(value);

  return confidence === null
    ? null
    : Math.min(100, Math.max(0, Math.round(confidence)));
}

function normalizePremiumFrequency(
  value: unknown
): PolicyPremiumFrequency | null {
  return ["monthly", "quarterly", "semiannual", "annual"].includes(
    value as PolicyPremiumFrequency
  )
    ? (value as PolicyPremiumFrequency)
    : null;
}

function sanitizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => normalizeNullableText(item))
        .filter((item): item is string => Boolean(item))
        .slice(0, 16)
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeDiscounts(value: unknown): PolicyCoverageDiscount[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const discounts: PolicyCoverageDiscount[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    const label = normalizeNullableText(item.label);
    const amount = normalizeNullableNumber(item.amount);

    if (!label && amount === null) {
      continue;
    }

    discounts.push({
      label,
      amount,
      notes: normalizeNullableText(item.notes),
    });

    if (discounts.length >= 12) {
      break;
    }
  }

  return discounts;
}

function sanitizeCoveragePremiums(value: Record<string, unknown>) {
  const premiumFinal =
    normalizeNullableNumber(value.premium_final) ??
    normalizeNullableNumber(value.premium_amount);

  return {
    premium_gross: normalizeNullableNumber(value.premium_gross),
    premium_final: premiumFinal,
    premium_amount: premiumFinal,
  };
}

function sanitizeProduct(value: unknown): PolicyProductDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = normalizeNullableText(value.name);

  if (!name) {
    return null;
  }

  const premiums = sanitizeCoveragePremiums(value);

  return {
    name,
    coverage_type: normalizeNullableText(value.coverage_type),
    ...premiums,
    premium_frequency: normalizePremiumFrequency(value.premium_frequency),
    discounts: sanitizeDiscounts(value.discounts),
    insured_person_name: normalizeNullableText(value.insured_person_name),
    insured_number: normalizeNullableText(value.insured_number),
    person_index: normalizeNullableNumber(value.person_index),
    applies_to: normalizeNullableText(value.applies_to),
    section_id: normalizeNullableText(value.section_id),
    source_page: normalizeNullableNumber(value.source_page),
    source_order: normalizeNullableNumber(value.source_order),
    confidence: normalizeConfidence(value.confidence),
    ownership_confidence: normalizeConfidence(value.ownership_confidence),
    uncertain: Boolean(value.uncertain),
    notes: normalizeNullableText(value.notes),
  };
}

function sanitizeProducts(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(sanitizeProduct)
        .filter((item): item is PolicyProductDetail => Boolean(item))
        .slice(0, 24)
    : [];
}

function sanitizeCoverage(value: unknown): PolicyCoverageDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = normalizeNullableText(value.name);

  if (!name) {
    return null;
  }

  const premiums = sanitizeCoveragePremiums(value);
  const assignmentSource = normalizeNullableText(value.assignment_source);

  const coverage: PolicyCoverageDetail = {
    name,
    stable_key: normalizeNullableText(value.stable_key),
    policy_type: isTypedPolicyType(normalizeNullableText(value.policy_type) ?? "")
      ? (normalizeNullableText(value.policy_type) as TypedPolicyType)
      : null,
    coverage_type: normalizeNullableText(value.coverage_type),
    category_label: normalizeNullableText(value.category_label),
    ...premiums,
    premium_frequency: normalizePremiumFrequency(value.premium_frequency),
    discounts: sanitizeDiscounts(value.discounts),
    deductible: normalizeNullableNumber(value.deductible),
    franchise: normalizeNullableNumber(value.franchise),
    coverage_amount: normalizeNullableNumber(value.coverage_amount),
    insured_person_name: normalizeNullableText(value.insured_person_name),
    insured_number: normalizeNullableText(value.insured_number),
    person_index: normalizeNullableNumber(value.person_index),
    applies_to: normalizeNullableText(value.applies_to),
    section_id: normalizeNullableText(value.section_id),
    source_page: normalizeNullableNumber(value.source_page),
    source_order: normalizeNullableNumber(value.source_order),
    confidence: normalizeConfidence(value.confidence),
    ownership_confidence: normalizeConfidence(value.ownership_confidence),
    assignment_source:
      assignmentSource === "manual" || assignmentSource === "ai"
        ? assignmentSource
        : assignmentSource,
    assigned_at: normalizeNullableText(value.assigned_at),
    uncertain: Boolean(value.uncertain),
    notes: normalizeNullableText(value.notes),
  };

  return {
    ...coverage,
    stable_key: coverage.stable_key ?? buildCoverageStableKey(coverage),
  };
}

function sanitizeCoverages(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(sanitizeCoverage)
        .filter((item): item is PolicyCoverageDetail => Boolean(item))
        .slice(0, 32)
    : [];
}

function readInsuredPersonName(value: Record<string, unknown>) {
  const direct = normalizeNullableText(value.name);
  if (direct) {
    return direct;
  }

  const fullName = normalizeNullableText(value.full_name);
  if (fullName) {
    return fullName;
  }

  const first = normalizeNullableText(value.first_name);
  const last = normalizeNullableText(value.last_name);

  if (first || last) {
    return [first, last].filter(Boolean).join(" ").trim() || null;
  }

  return null;
}

function parsePolicyDetailsSource(details: unknown): Record<string, unknown> | null {
  if (typeof details === "string") {
    try {
      const parsed: unknown = JSON.parse(details);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isRecord(details) ? details : null;
}

function sanitizeInsuredPerson(value: unknown): PolicyInsuredPersonDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const personName = readInsuredPersonName(value);

  const hasAnyValue =
    [
      personName,
      value.birth_date,
      value.insured_number,
      value.customer_number,
      value.policy_number,
      value.section_id,
      value.premium_amount,
      value.total_monthly_premium,
      value.base_premium,
      value.complementary_premium,
      value.franchise,
      value.deductible,
      value.model,
    ].some((item) => item !== null && item !== undefined && item !== "") ||
    (Array.isArray(value.coverages) && value.coverages.length > 0);

  if (!hasAnyValue) {
    return null;
  }

  const person: PolicyInsuredPersonDetail = {
    name: personName,
    stable_key: normalizeNullableText(value.stable_key),
    birth_date: normalizeNullableText(value.birth_date),
    insured_number: normalizeNullableText(value.insured_number),
    customer_number: normalizeNullableText(value.customer_number),
    policy_number: normalizeNullableText(value.policy_number),
    section_id: normalizeNullableText(value.section_id),
    source_order: normalizeNullableNumber(value.source_order),
    premium_amount: normalizeNullableNumber(value.premium_amount),
    premium_frequency: normalizePremiumFrequency(value.premium_frequency),
    total_monthly_premium: normalizeNullableNumber(value.total_monthly_premium),
    base_premium: normalizeNullableNumber(value.base_premium),
    complementary_premium: normalizeNullableNumber(value.complementary_premium),
    franchise: normalizeNullableNumber(value.franchise),
    deductible: normalizeNullableNumber(value.deductible),
    model: normalizeNullableText(value.model),
    accident_covered: normalizeNullableBoolean(value.accident_covered),
    confidence: normalizeConfidence(value.confidence),
    uncertain: Boolean(value.uncertain),
  };

  const personCoverages = sanitizeCoverages(value.coverages);

  if (personCoverages.length > 0) {
    person.coverages = personCoverages;
  }

  return {
    ...person,
    stable_key: person.stable_key ?? buildPersonStableKey(person),
  };
}

function sanitizeInsuredPeople(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(sanitizeInsuredPerson)
        .filter((item): item is PolicyInsuredPersonDetail => Boolean(item))
        .slice(0, 24)
    : [];
}

function sanitizeFieldConfidence(value: unknown): PolicyFieldConfidence | null {
  if (!isRecord(value) || !isPolicyDetailScalar(value.value)) {
    return null;
  }

  return {
    value: value.value,
    confidence: normalizeConfidence(value.confidence),
    uncertain: Boolean(value.uncertain),
    evidence: normalizeNullableText(value.evidence),
  };
}

function sanitizeFieldConfidenceMap(value: unknown): PolicyFieldConfidenceMap {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(fieldConfidenceLabels).reduce<PolicyFieldConfidenceMap>(
    (result, [key]) => {
      const confidence = sanitizeFieldConfidence(value[key]);

      if (confidence) {
        result[key as PolicyFieldConfidenceKey] = confidence;
      }

      return result;
    },
    {}
  );
}

function sanitizeBaseInsurance(value: unknown): PolicyBaseInsuranceDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const hasAnyValue = [
    value.name,
    value.model,
    value.premium_amount,
    value.franchise,
    value.notes,
  ].some((item) => item !== null && item !== undefined && item !== "");

  if (!hasAnyValue) {
    return null;
  }

  return {
    name: normalizeNullableText(value.name),
    model: normalizeNullableText(value.model),
    premium_amount: normalizeNullableNumber(value.premium_amount),
    franchise: normalizeNullableNumber(value.franchise),
    notes: normalizeNullableText(value.notes),
  };
}

function sanitizePremiumSummary(value: unknown): PolicyPremiumSummaryDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  const finalMonthly =
    normalizeNullableNumber(value.final_monthly) ??
    normalizeNullableNumber(value.total_monthly);

  const hasAnyValue = [
    value.total_monthly,
    value.total_annual,
    value.gross_monthly,
    value.discounts_total,
    value.final_monthly,
    value.currency,
    value.notes,
  ].some((item) => item !== null && item !== undefined && item !== "");

  if (!hasAnyValue) {
    return null;
  }

  return {
    total_monthly: normalizeNullableNumber(value.total_monthly) ?? finalMonthly,
    total_annual: normalizeNullableNumber(value.total_annual),
    gross_monthly: normalizeNullableNumber(value.gross_monthly),
    discounts_total: normalizeNullableNumber(value.discounts_total),
    final_monthly: finalMonthly,
    currency: normalizeNullableText(value.currency)?.toUpperCase() ?? null,
    notes: normalizeNullableText(value.notes),
  };
}

function sanitizeExtractionMetadata(value: unknown): PolicyExtractionMetadata {
  if (!isRecord(value)) {
    return {};
  }

  return {
    matched_keywords: sanitizeStringArray(value.matched_keywords),
    inferred_sections: sanitizeStringArray(value.inferred_sections),
    warnings: sanitizeStringArray(value.warnings),
    provider_raw: normalizeNullableText(value.provider_raw),
    normalized_provider: normalizeNullableText(value.normalized_provider),
    provider_aliases_matched: sanitizeStringArray(value.provider_aliases_matched),
    detected_languages: sanitizeStringArray(value.detected_languages),
    source_hints: sanitizeStringArray(value.source_hints),
  };
}

function hasDisplayValue(value: PolicyDetailValue | undefined) {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

function getCoverageKindLabel(value: unknown) {
  return typeof value === "string" && isSwissPolicySubtype(value)
    ? swissPolicySubtypeLabels[value]
    : normalizeNullableText(value);
}

function stringifyStructuredDetail(key: keyof PolicyDetails, value: PolicyDetailValue) {
  if (key === "coverage_kind") {
    return getCoverageKindLabel(value) ?? "";
  }

  if (key === "insured_people" && Array.isArray(value)) {
    return value.length === 1 ? "1 persona" : `${value.length} persone`;
  }

  if (
    (key === "coverages" ||
      key === "products" ||
      key === "complementary_products") &&
    Array.isArray(value)
  ) {
    return value.length === 1 ? "1 copertura" : `${value.length} coperture`;
  }

  if (key === "field_confidence") {
    const uncertainCount = getPolicyFieldConfidenceRows({
      field_confidence: value as PolicyFieldConfidenceMap,
    }).filter((row) => row.uncertain).length;

    return uncertainCount > 0
      ? `${uncertainCount} campi incerti`
      : "Confidenze disponibili";
  }

  if (key === "extraction_metadata") {
    const metadata = value as PolicyExtractionMetadata;
    const warningCount = metadata.warnings?.length ?? 0;

    return warningCount > 0
      ? `${warningCount} avviso${warningCount === 1 ? "" : "i"}`
      : "Metadati disponibili";
  }

  if (key === "base_insurance" && value && typeof value === "object") {
    const base = value as PolicyBaseInsuranceDetail;
    return [base.name, base.model].filter(Boolean).join(" / ") || "Base rilevata";
  }

  if (key === "premium_summary" && value && typeof value === "object") {
    const summary = value as PolicyPremiumSummaryDetail;
    const parts: string[] = [];

    if (summary.total_monthly !== null && summary.total_monthly !== undefined) {
      parts.push(`${formatCHF(summary.total_monthly)} / mese`);
    }
    if (summary.total_annual !== null && summary.total_annual !== undefined) {
      parts.push(`${formatCHF(summary.total_annual)} / anno`);
    }

    return parts.join(" · ") || "Riepilogo disponibile";
  }

  return null;
}

function stringifyDetail(key: keyof PolicyDetails, value: PolicyDetailValue) {
  const structuredDetail = stringifyStructuredDetail(key, value);

  if (structuredDetail !== null) {
    return structuredDetail;
  }

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

  if (
    /(cassa|malat|salut|health|helsana|lamal|lca|kvg|vvg|ospedal|dent|infortun|accident)/.test(
      normalizedValue
    )
  ) {
    return "health";
  }

  if (/(rc privata|responsabil|liability)/.test(normalizedValue)) {
    return "liability";
  }

  if (/(economia|domestic|mobilia|household|casa)/.test(normalizedValue)) {
    return "household";
  }

  if (/(auto|casco|car|veicol|vehicle|teilkasko|vollkasko)/.test(normalizedValue)) {
    return "car";
  }

  if (/(giurid|legal|recht|protection juridique)/.test(normalizedValue)) {
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
  const source = parsePolicyDetailsSource(details);

  if (!source) {
    return {};
  }

  if (
    !Array.isArray(source.insured_people) &&
    Array.isArray(source.insured_persons)
  ) {
    source.insured_people = source.insured_persons;
  }
  const allowedKeys = [
    ...new Set([...policyDetailKeys[policyType], ...sharedPolicyDetailKeys]),
  ];

  return allowedKeys.reduce<PolicyDetails>((result, key) => {
    const value = source[key];

    switch (key) {
      case "coverage_kind": {
        result.coverage_kind = normalizeNullableText(value);
        break;
      }
      case "franchise":
      case "deductible":
      case "annual_km":
      case "insured_sum":
      case "liability_limit":
      case "household_members_included": {
        result[key] = normalizeNullableNumber(value) as never;
        break;
      }
      case "base_insurance": {
        const baseInsurance = sanitizeBaseInsurance(value);

        if (baseInsurance) {
          result.base_insurance = baseInsurance;
        }
        break;
      }
      case "premium_summary": {
        const premiumSummary = sanitizePremiumSummary(value);

        if (premiumSummary) {
          result.premium_summary = premiumSummary;
        }
        break;
      }
      case "collective_contract": {
        result.collective_contract = normalizeNullableBoolean(value);
        break;
      }
      case "complementary":
      case "accident_covered":
      case "telemedicine":
      case "family_doctor_model":
      case "glass_coverage":
      case "theft_coverage":
      case "private_legal":
      case "traffic_legal": {
        result[key] = normalizeNullableBoolean(value) as never;
        break;
      }
      case "complementary_products":
      case "products": {
        const products = sanitizeProducts(value);

        if (products.length > 0) {
          result[key] = products as never;
        }
        break;
      }
      case "insured_people": {
        const insuredPeople = sanitizeInsuredPeople(value);

        if (insuredPeople.length > 0) {
          result.insured_people = insuredPeople;
        }
        break;
      }
      case "coverages": {
        const coverages = sanitizeCoverages(value);

        if (coverages.length > 0) {
          result.coverages = coverages;
        }
        break;
      }
      case "field_confidence": {
        const fieldConfidence = sanitizeFieldConfidenceMap(value);

        if (Object.keys(fieldConfidence).length > 0) {
          result.field_confidence = fieldConfidence;
        }
        break;
      }
      case "extraction_metadata": {
        const metadata = sanitizeExtractionMetadata(value);
        const hasMetadata =
          Boolean(metadata.provider_raw) ||
          Boolean(metadata.normalized_provider) ||
          Boolean(metadata.matched_keywords?.length) ||
          Boolean(metadata.inferred_sections?.length) ||
          Boolean(metadata.warnings?.length) ||
          Boolean(metadata.provider_aliases_matched?.length) ||
          Boolean(metadata.detected_languages?.length) ||
          Boolean(metadata.source_hints?.length);

        if (hasMetadata) {
          result.extraction_metadata = metadata;
        }
        break;
      }
      default: {
        if (isPolicyDetailScalar(value)) {
          result[key] = value as never;
        }
      }
    }

    return result;
  }, {});
}

export interface PolicyDetailRow {
  key: keyof PolicyDetails;
  label: string;
  value: string;
}

export function getPolicyDetailRows(
  policyType: TypedPolicyType,
  details: PolicyDetails
): PolicyDetailRow[] {
  return policyDetailKeys[policyType]
    .map((key) => {
      const value = details[key];

      if (!hasDisplayValue(value)) {
        return null;
      }

      const displayValue = stringifyDetail(key, value as PolicyDetailValue);

      return {
        key,
        label: detailLabels[key],
        value:
          displayValue === null || displayValue === undefined
            ? ""
            : String(displayValue),
      };
    })
    .filter((row): row is PolicyDetailRow => Boolean(row));
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

export function getPolicyCoverages(details: PolicyDetails) {
  return details.coverages ?? [];
}

export function getPolicyInsuredPeople(details: PolicyDetails) {
  if ((details.insured_people?.length ?? 0) > 0) {
    return details.insured_people ?? [];
  }

  return inferInsuredPeopleFromDetails(details);
}

export { getPolicyCoveragesForDisplay, inferInsuredPeopleFromDetails } from "@/lib/policy-health-grouping";

export function getPolicyProducts(details: PolicyDetails) {
  return [...(details.complementary_products ?? []), ...(details.products ?? [])];
}

export function getPolicyExtractionMetadata(details: PolicyDetails) {
  return details.extraction_metadata ?? {};
}

export interface PolicyFieldConfidenceRow {
  key: string;
  label: string;
  value: string;
  confidence: number | null;
  uncertain: boolean;
  evidence: string | null;
}

export function getPolicyFieldConfidenceRows(
  details: PolicyDetails
): PolicyFieldConfidenceRow[] {
  const confidence = details.field_confidence ?? {};

  return Object.entries(fieldConfidenceLabels)
    .map(([key, label]) => {
      const item = confidence[key as PolicyFieldConfidenceKey];

      if (!item) {
        return null;
      }

      const displayValue =
        item.value === null || item.value === undefined
          ? ""
          : typeof item.value === "boolean"
            ? item.value
              ? "Si"
              : "No"
            : String(item.value);

      return {
        key,
        label,
        value: displayValue,
        confidence: item.confidence,
        uncertain: item.uncertain,
        evidence: item.evidence ?? null,
      };
    })
    .filter((row): row is PolicyFieldConfidenceRow => Boolean(row));
}
