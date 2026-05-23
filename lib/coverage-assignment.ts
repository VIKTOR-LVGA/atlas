import {
  buildPersonStableKey,
  coverageMatchesStableKey,
  productMatchesStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import {
  computeHealthPolicyGroupingForDetails,
  productToCoverage,
} from "@/lib/policy-health-grouping";
import type {
  PolicyCoverageDetail,
  PolicyDetails,
  PolicyInsuredPersonDetail,
} from "@/lib/types";

export class CoverageAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoverageAssignmentError";
  }
}

export type ManualAssignmentResult = {
  details: PolicyDetails;
  coverage: PolicyCoverageDetail;
  person: PolicyInsuredPersonDetail;
  ownershipConfidenceBefore: number | null;
  previousAssignment: {
    insured_person_name: string | null;
    insured_number: string | null;
    person_stable_key: string | null;
    assignment_source: string | null;
  };
};

function findPersonIndex(
  people: PolicyInsuredPersonDetail[],
  personStableKey: string
) {
  return people.findIndex(
    (person) => buildPersonStableKey(person) === personStableKey
  );
}

function collectAssignableCoverage(
  details: PolicyDetails,
  familyPremium: number | null,
  coverageStableKey: string
): PolicyCoverageDetail | null {
  const grouped = computeHealthPolicyGroupingForDetails(details, familyPremium);

  const fromUnassigned = grouped.unassignedCoverages.find((coverage) =>
    coverageMatchesStableKey(coverage, coverageStableKey)
  );

  if (fromUnassigned) {
    return fromUnassigned;
  }

  for (const coverage of details.coverages ?? []) {
    if (coverageMatchesStableKey(coverage, coverageStableKey)) {
      return coverage;
    }
  }

  for (const product of [
    ...(details.products ?? []),
    ...(details.complementary_products ?? []),
  ]) {
    const coverage = productToCoverage(product);
    if (coverageMatchesStableKey(coverage, coverageStableKey)) {
      return coverage;
    }
  }

  for (const person of details.insured_people ?? []) {
    for (const coverage of person.coverages ?? []) {
      if (coverageMatchesStableKey(coverage, coverageStableKey)) {
        return coverage;
      }
    }
  }

  return null;
}

function removeCoverageFromGlobalPools(
  details: PolicyDetails,
  coverageStableKey: string
): PolicyDetails {
  const filterCoverages = (items: PolicyCoverageDetail[] | undefined) =>
    (items ?? []).filter(
      (item) => !coverageMatchesStableKey(item, coverageStableKey)
    );

  return {
    ...details,
    coverages: filterCoverages(details.coverages),
    products: (details.products ?? []).filter(
      (item) => !productMatchesStableKey(item, coverageStableKey)
    ),
    complementary_products: (details.complementary_products ?? []).filter(
      (item) => !productMatchesStableKey(item, coverageStableKey)
    ),
  };
}

function removeCoverageFromOtherPeople(
  people: PolicyInsuredPersonDetail[],
  targetIndex: number,
  coverageStableKey: string
) {
  return people.map((person, index) => {
    if (index === targetIndex) {
      return person;
    }

    const coverages = (person.coverages ?? []).filter(
      (coverage) => !coverageMatchesStableKey(coverage, coverageStableKey)
    );

    return coverages.length > 0 ? { ...person, coverages } : { ...person, coverages: [] };
  });
}

export function applyManualCoverageAssignment(
  details: PolicyDetails,
  familyPremium: number | null,
  coverageStableKey: string,
  personStableKey: string,
  assignedAt: string
): ManualAssignmentResult {
  const people = [...(details.insured_people ?? [])];

  if (people.length === 0) {
    throw new CoverageAssignmentError("Nessuna persona assicurata nella polizza.");
  }

  const personIndex = findPersonIndex(people, personStableKey);

  if (personIndex < 0) {
    throw new CoverageAssignmentError("Persona assicurata non trovata.");
  }

  const sourceCoverage = collectAssignableCoverage(
    details,
    familyPremium,
    coverageStableKey
  );

  if (!sourceCoverage) {
    throw new CoverageAssignmentError("Copertura non trovata o già assegnata.");
  }

  const targetPerson = people[personIndex];
  const ownershipConfidenceBefore = sourceCoverage.ownership_confidence ?? null;
  const previousAssignment = {
    insured_person_name: sourceCoverage.insured_person_name ?? null,
    insured_number: sourceCoverage.insured_number ?? null,
    person_stable_key: sourceCoverage.insured_person_name
      ? buildPersonStableKey({
          name: sourceCoverage.insured_person_name,
          insured_number: sourceCoverage.insured_number,
        })
      : null,
    assignment_source: sourceCoverage.assignment_source ?? null,
  };

  const assignedCoverage = withCoverageStableKey({
    ...sourceCoverage,
    stable_key: coverageStableKey,
    insured_person_name: targetPerson.name,
    insured_number: targetPerson.insured_number ?? sourceCoverage.insured_number,
    ownership_confidence: 100,
    assignment_source: "manual",
    assigned_at: assignedAt,
    uncertain: false,
  });

  const existingOnPerson = (targetPerson.coverages ?? []).some((coverage) =>
    coverageMatchesStableKey(coverage, coverageStableKey)
  );

  const updatedPeople = removeCoverageFromOtherPeople(
    people,
    personIndex,
    coverageStableKey
  );

  updatedPeople[personIndex] = {
    ...updatedPeople[personIndex],
    coverages: existingOnPerson
      ? (updatedPeople[personIndex].coverages ?? []).map((coverage) =>
          coverageMatchesStableKey(coverage, coverageStableKey)
            ? assignedCoverage
            : coverage
        )
      : [...(updatedPeople[personIndex].coverages ?? []), assignedCoverage],
  };

  let nextDetails: PolicyDetails = {
    ...details,
    insured_people: updatedPeople,
  };

  nextDetails = removeCoverageFromGlobalPools(nextDetails, coverageStableKey);

  return {
    details: nextDetails,
    coverage: assignedCoverage,
    person: updatedPeople[personIndex],
    ownershipConfidenceBefore,
    previousAssignment,
  };
}
