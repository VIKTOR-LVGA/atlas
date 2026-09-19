import type { InsuranceCategory } from "@/lib/insurance-knowledge/categories";
import type { InsuranceDocumentType } from "@/lib/insurance-knowledge/document-types";

export const factProvenanceValues = ["explicit", "derived", "unknown"] as const;
export type FactProvenance = (typeof factProvenanceValues)[number];

export type ExtractedFact<T> = {
  value: T | null;
  provenance: FactProvenance;
  confidence: number | null;
  evidence: string | null;
  sourcePage: number | null;
};

export type CanonicalCoverageItem = {
  canonicalType: string;
  originalLabel: string;
  category: InsuranceCategory;
  status: "included" | "excluded" | "conditional" | "unknown";
  limitAmount: number | null;
  limitUnit: string | null;
  currency: string | null;
  deductibleAmount: number | null;
  deductibleUnit: string | null;
  reimbursementPercent: number | null;
  waitingPeriodDays: number | null;
  territorialScope: string | null;
  appliesTo: string | null;
  provenance: FactProvenance;
  confidence: number | null;
  evidence: string | null;
  sourcePage: number | null;
  terms: Record<string, unknown>;
};

export type CanonicalPolicyExtraction = {
  documentType: ExtractedFact<InsuranceDocumentType>;
  insurer: ExtractedFact<string>;
  legalEntity: ExtractedFact<string>;
  productName: ExtractedFact<string>;
  policyNumber: ExtractedFact<string>;
  category: ExtractedFact<InsuranceCategory>;
  subcategory: ExtractedFact<string>;
  policyholder: ExtractedFact<string>;
  insuredPeople: ExtractedFact<string[]>;
  insuredObject: ExtractedFact<Record<string, unknown>>;
  startDate: ExtractedFact<string>;
  endDate: ExtractedFact<string>;
  renewalDate: ExtractedFact<string>;
  cancellationDeadline: ExtractedFact<string>;
  premiumAmount: ExtractedFact<number>;
  premiumFrequency: ExtractedFact<string>;
  annualizedPremium: ExtractedFact<number>;
  currency: ExtractedFact<string>;
  deductible: ExtractedFact<number>;
  coverageItems: CanonicalCoverageItem[];
  exclusionsReference: ExtractedFact<string>;
  documentLanguage: ExtractedFact<"it" | "de" | "fr" | "other">;
  sourceDocument: string;
  categorySpecific: Record<string, ExtractedFact<unknown>>;
  confidence: number | null;
};

export const categorySpecificExtractionFields: Record<InsuranceCategory, string[]> = {
  health_basic: ["model", "franchise", "coinsurance_percent", "accident_included"],
  health_supplementary: ["hospital_class", "supplementary_modules", "waiting_period"],
  vehicle: ["vehicle_make", "vehicle_model", "license_plate", "first_registration", "insured_value_basis"],
  household: ["insured_address", "insured_sum", "household_size", "theft_away_from_home"],
  private_liability: ["insured_household", "territorial_scope", "liability_limit"],
  legal_protection: ["legal_domains", "territorial_scope", "waiting_period", "maximum_benefit"],
  travel: ["territorial_scope", "trip_duration_limit", "family_cover"],
  life: ["beneficiaries", "death_capital", "disability_annuity", "term_years"],
  pension: ["pillar", "beneficiaries", "savings_component", "investment_component", "surrender_value"],
  building: ["insured_address", "building_value", "construction_year"],
  pet: ["animal_name", "species", "breed", "annual_limit"],
  accident_income: ["daily_benefit", "waiting_period", "benefit_duration"],
  business: ["business_activity"],
  other: ["generic_details"],
};

export function unknownFact<T>(): ExtractedFact<T> {
  return {
    value: null,
    provenance: "unknown",
    confidence: null,
    evidence: null,
    sourcePage: null,
  };
}
