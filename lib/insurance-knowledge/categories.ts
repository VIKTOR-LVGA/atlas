export const insuranceCategories = [
  "health_basic",
  "health_supplementary",
  "vehicle",
  "household",
  "private_liability",
  "legal_protection",
  "travel",
  "life",
  "pension",
  "building",
  "pet",
  "accident_income",
  "business",
  "other",
] as const;

export type InsuranceCategory = (typeof insuranceCategories)[number];

export type InsuranceCategoryDefinition = {
  id: InsuranceCategory;
  label: string;
  policyType:
    | "health"
    | "liability"
    | "household"
    | "car"
    | "legal"
    | "travel"
    | "life"
    | "pension"
    | "building"
    | "pet"
    | "other";
  insuredSubject: "person" | "household" | "vehicle" | "property" | "contract" | "pet";
  relationalFields: string[];
  structuredFields: string[];
};

/**
 * Canonical category/storage boundary. Shared query fields stay relational;
 * category-specific facts remain structured JSON; purchased protections become
 * policy_coverages rows only when a personal policy explicitly supports them.
 */
export const insuranceCategoryDefinitions: InsuranceCategoryDefinition[] = [
  {
    id: "health_basic",
    label: "Assicurazione di base LAMal / KVG",
    policyType: "health",
    insuredSubject: "person",
    relationalFields: ["family_member_id"],
    structuredFields: [
      "model",
      "franchise",
      "coinsurance_percent",
      "accident_included",
      "premium_region",
    ],
  },
  {
    id: "health_supplementary",
    label: "Assicurazione malattia complementare LCA / VVG",
    policyType: "health",
    insuredSubject: "person",
    relationalFields: ["family_member_id"],
    structuredFields: ["hospital_class", "supplementary_modules", "waiting_period"],
  },
  {
    id: "vehicle",
    label: "Veicoli",
    policyType: "car",
    insuredSubject: "vehicle",
    relationalFields: ["vehicle_id"],
    structuredFields: ["bonus_malus", "annual_km", "insured_value_basis"],
  },
  {
    id: "household",
    label: "Mobilia domestica",
    policyType: "household",
    insuredSubject: "household",
    relationalFields: ["property_id"],
    structuredFields: ["insured_address", "insured_sum", "household_size"],
  },
  {
    id: "private_liability",
    label: "Responsabilita civile privata",
    policyType: "liability",
    insuredSubject: "household",
    relationalFields: ["property_id", "policy_members"],
    structuredFields: ["insured_household", "territorial_scope"],
  },
  {
    id: "legal_protection",
    label: "Protezione giuridica",
    policyType: "legal",
    insuredSubject: "household",
    relationalFields: ["policy_members"],
    structuredFields: ["legal_domains", "territorial_scope", "waiting_period"],
  },
  {
    id: "travel",
    label: "Viaggio",
    policyType: "travel",
    insuredSubject: "person",
    relationalFields: ["policy_members"],
    structuredFields: ["territorial_scope", "trip_duration_limit", "family_cover"],
  },
  {
    id: "life",
    label: "Vita e rischio",
    policyType: "life",
    insuredSubject: "person",
    relationalFields: ["family_member_id", "policy_members"],
    structuredFields: ["beneficiaries", "benefit_form", "waiting_period", "term_years"],
  },
  {
    id: "pension",
    label: "Previdenza 3a / 3b",
    policyType: "pension",
    insuredSubject: "contract",
    relationalFields: ["family_member_id"],
    structuredFields: [
      "pillar",
      "beneficiaries",
      "savings_component",
      "investment_component",
      "surrender_value",
    ],
  },
  {
    id: "building",
    label: "Stabili",
    policyType: "building",
    insuredSubject: "property",
    relationalFields: ["property_id"],
    structuredFields: ["insured_address", "building_value", "construction_year"],
  },
  {
    id: "pet",
    label: "Animali domestici",
    policyType: "pet",
    insuredSubject: "pet",
    relationalFields: [],
    structuredFields: ["animal_name", "species", "breed", "birth_date"],
  },
  {
    id: "accident_income",
    label: "Infortuni e perdita di guadagno",
    policyType: "other",
    insuredSubject: "person",
    relationalFields: ["family_member_id", "policy_members"],
    structuredFields: ["daily_benefit", "waiting_period", "benefit_duration"],
  },
  {
    id: "business",
    label: "Aziendale",
    policyType: "other",
    insuredSubject: "contract",
    relationalFields: [],
    structuredFields: ["business_activity"],
  },
  {
    id: "other",
    label: "Altro",
    policyType: "other",
    insuredSubject: "contract",
    relationalFields: [],
    structuredFields: ["generic_details"],
  },
];

export function isInsuranceCategory(value: string): value is InsuranceCategory {
  return insuranceCategories.includes(value as InsuranceCategory);
}
