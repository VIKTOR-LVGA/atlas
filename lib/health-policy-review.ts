import {
  buildCoverageStableKey,
  buildPersonStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import type { HealthPolicyGroupedView } from "@/lib/policy-health-grouping";
import type {
  PolicyCoverageDetail,
  PolicyDetails,
  PolicyInsuredPersonDetail,
} from "@/lib/types";

export type HealthReviewCoverage = {
  stableKey: string;
  name: string;
  coverage_type: string | null;
  category_label: string | null;
  premium_final: number | null;
  premium_gross?: number | null;
  notes: string | null;
  assignment_source: string | null;
  suggested_person_stable_key?: string | null;
  suggested_person_name?: string | null;
  confidence?: number | null;
  ownership_confidence?: number | null;
  source_order?: number | null;
  source_page?: number | null;
};

export type HealthReviewPersonRef = Pick<
  HealthReviewPerson,
  "stableKey" | "name" | "insured_number"
>;

export type HealthReviewPerson = {
  stableKey: string;
  name: string | null;
  insured_number: string | null;
  birth_date: string | null;
  franchise: number | null;
  model: string | null;
  total_monthly_premium: number | null;
  coverages: HealthReviewCoverage[];
};

export type HealthReviewState = {
  people: HealthReviewPerson[];
  unassigned: HealthReviewCoverage[];
};

function normalizeNameToken(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function inferSuggestedPerson(
  coverage: PolicyCoverageDetail,
  people: HealthReviewPersonRef[]
): { stableKey: string | null; name: string | null } {
  const coverageNumber = (coverage.insured_number ?? "").replace(/\s+/g, "");
  const coverageName = normalizeNameToken(coverage.insured_person_name);

  for (const person of people) {
    const personNumber = (person.insured_number ?? "").replace(/\s+/g, "");
    const personName = normalizeNameToken(person.name);

    if (coverageNumber && personNumber && coverageNumber === personNumber) {
      return { stableKey: person.stableKey, name: person.name };
    }

    if (
      coverageName &&
      personName &&
      (coverageName === personName ||
        coverageName.includes(personName) ||
        personName.includes(coverageName))
    ) {
      return { stableKey: person.stableKey, name: person.name };
    }
  }

  if (coverage.insured_person_name?.trim()) {
    return {
      stableKey: null,
      name: coverage.insured_person_name.trim(),
    };
  }

  return { stableKey: null, name: null };
}

function coverageToReviewItem(
  coverage: PolicyCoverageDetail,
  people: HealthReviewPersonRef[]
): HealthReviewCoverage {
  const withKey = withCoverageStableKey(coverage);
  const suggestion = inferSuggestedPerson(withKey, people);

  return {
    stableKey: withKey.stable_key ?? buildCoverageStableKey(withKey),
    name: withKey.name,
    coverage_type: withKey.coverage_type ?? null,
    category_label: withKey.category_label ?? null,
    premium_final:
      withKey.premium_final ?? withKey.premium_amount ?? null,
    premium_gross: withKey.premium_gross ?? null,
    notes: withKey.notes ?? null,
    assignment_source: withKey.assignment_source ?? null,
    suggested_person_stable_key: suggestion.stableKey,
    suggested_person_name: suggestion.name,
    confidence: withKey.confidence ?? null,
    ownership_confidence: withKey.ownership_confidence ?? null,
    source_order: withKey.source_order ?? null,
    source_page: withKey.source_page ?? null,
  };
}

export function suggestPersonForCoverage(
  coverage: PolicyCoverageDetail,
  people: HealthReviewPersonRef[]
) {
  return inferSuggestedPerson(coverage, people);
}

export function healthReviewStateFromGroupedView(
  grouped: HealthPolicyGroupedView
): HealthReviewState {
  const people: HealthReviewPerson[] = grouped.people.map((person) => ({
    stableKey: buildPersonStableKey(person),
    name: person.name,
    insured_number: person.insured_number ?? null,
    birth_date: person.birth_date ?? null,
    franchise: person.franchise ?? null,
    model: person.model ?? null,
    total_monthly_premium: person.total_monthly_premium ?? null,
    coverages: [],
  }));

  const peopleRefs: HealthReviewPersonRef[] = people.map((person) => ({
    stableKey: person.stableKey,
    name: person.name,
    insured_number: person.insured_number,
  }));

  return {
    people: grouped.people.map((person, index) => ({
      ...people[index],
      coverages: person.coverages.map((coverage) =>
        coverageToReviewItem(coverage, peopleRefs)
      ),
    })),
    unassigned: grouped.unassignedCoverages.map((coverage) =>
      coverageToReviewItem(coverage, peopleRefs)
    ),
  };
}

export function parseHealthReviewJson(value: string): HealthReviewState | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (!Array.isArray(record.people) || !Array.isArray(record.unassigned)) {
      return null;
    }

    return parsed as HealthReviewState;
  } catch {
    return null;
  }
}

function reviewCoverageToDetail(
  coverage: HealthReviewCoverage,
  person: HealthReviewPerson | null
): PolicyCoverageDetail {
  const premium = coverage.premium_final;
  const isManualAssignment = Boolean(person);

  return {
    name: coverage.name.trim() || "Copertura",
    stable_key: coverage.stableKey,
    coverage_type: coverage.coverage_type,
    category_label: coverage.category_label,
    premium_gross: coverage.premium_gross ?? null,
    premium_final: premium,
    premium_amount: premium,
    notes: coverage.notes,
    insured_person_name: person?.name ?? null,
    insured_number: person?.insured_number ?? null,
    source_order: coverage.source_order ?? null,
    source_page: coverage.source_page ?? null,
    confidence: coverage.confidence ?? null,
    assignment_source: isManualAssignment
      ? "manual"
      : coverage.assignment_source ?? null,
    ownership_confidence: isManualAssignment
      ? 100
      : coverage.ownership_confidence ?? null,
    uncertain: false,
  };
}

export function policyDetailsFromHealthReviewState(
  state: HealthReviewState,
  existing: PolicyDetails
): PolicyDetails {
  const insuredPeople: PolicyInsuredPersonDetail[] = state.people.map(
    (person) => ({
      name: person.name,
      stable_key: person.stableKey,
      insured_number: person.insured_number,
      birth_date: person.birth_date,
      franchise: person.franchise,
      model: person.model,
      total_monthly_premium: person.total_monthly_premium,
      coverages: person.coverages.map((coverage) =>
        reviewCoverageToDetail(coverage, person)
      ),
    })
  );

  const unassignedCoverages = state.unassigned.map((coverage) =>
    reviewCoverageToDetail(coverage, null)
  );

  return {
    ...existing,
    insured_people: insuredPeople,
    coverages: unassignedCoverages,
    products: [],
    complementary_products: [],
  };
}

export function mergeHealthFormDetails(
  formDetails: PolicyDetails,
  existing: PolicyDetails,
  healthReviewJson: string | null | undefined
): PolicyDetails {
  if (healthReviewJson?.trim()) {
    const state = parseHealthReviewJson(healthReviewJson);

    if (state) {
      return {
        ...policyDetailsFromHealthReviewState(state, existing),
        ...formDetails,
      };
    }
  }

  return {
    ...existing,
    ...formDetails,
  };
}
