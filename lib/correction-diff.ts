import {
  buildCoverageStableKey,
  buildPersonStableKey,
  withCoverageStableKey,
} from "@/lib/coverage-stable-keys";
import type { CorrectionSignalInput } from "@/lib/correction-learning";
import { computeHealthPolicyGroupingForDetails } from "@/lib/policy-health-grouping";
import type {
  PolicyDetails,
  PolicyFieldConfidenceKey,
  PolicyInput,
  PolicyInsuredPersonDetail,
  PolicyCoverageDetail,
  TypedPolicyType,
  UserPolicy,
} from "@/lib/types";

type CorrectionContext = Pick<
  CorrectionSignalInput,
  "policy_id" | "document_id" | "provider" | "policy_type"
>;

function normalizeComparable(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function valuesEqual(before: unknown, after: unknown) {
  return normalizeComparable(before) === normalizeComparable(after);
}

function getFieldConfidence(
  details: PolicyDetails,
  key: PolicyFieldConfidenceKey
) {
  return details.field_confidence?.[key]?.confidence ?? null;
}

function getEvidenceSnippet(
  details: PolicyDetails,
  key: PolicyFieldConfidenceKey
) {
  const evidence = details.field_confidence?.[key]?.evidence;
  return typeof evidence === "string" && evidence.trim()
    ? evidence.trim().slice(0, 280)
    : null;
}

function correctionSourceForField(
  fieldName: string
): CorrectionSignalInput["correction_source"] {
  if (fieldName === "premium_amount" || fieldName === "premium_frequency") {
    return "premium";
  }

  if (
    fieldName === "renewal_date" ||
    fieldName === "start_date" ||
    fieldName === "end_date"
  ) {
    return "renewal";
  }

  if (fieldName === "deductible") {
    return "deductible";
  }

  if (fieldName === "policy_category_label") {
    return "category";
  }

  return "policy_field";
}

function pushScalarChange(
  signals: CorrectionSignalInput[],
  context: CorrectionContext,
  options: {
    fieldName: string;
    fieldPath: string;
    before: unknown;
    after: unknown;
    correctionSource?: CorrectionSignalInput["correction_source"];
    confidenceBefore?: number | null;
    sourceContext?: Record<string, unknown> | null;
    coverageStableKey?: string | null;
    coverageName?: string | null;
    coverageKind?: string | null;
  }
) {
  if (valuesEqual(options.before, options.after)) {
    return;
  }

  const beforeNorm = normalizeComparable(options.before);
  const afterNorm = normalizeComparable(options.after);
  const kind =
    beforeNorm === null && afterNorm !== null
      ? "added"
      : beforeNorm !== null && afterNorm === null
        ? "removed"
        : "changed";

  signals.push({
    policy_id: context.policy_id,
    document_id: context.document_id,
    provider: context.provider,
    policy_type: context.policy_type,
    correction_kind: kind,
    correction_source:
      options.correctionSource ?? correctionSourceForField(options.fieldName),
    field_name: options.fieldName,
    field_path: options.fieldPath,
    ai_value_before: options.before ?? null,
    corrected_value_after: options.after ?? null,
    confidence_before: options.confidenceBefore ?? null,
    coverage_stable_key: options.coverageStableKey ?? null,
    coverage_name: options.coverageName ?? null,
    coverage_kind: options.coverageKind ?? null,
    source_context: options.sourceContext ?? null,
  });
}

const POLICY_SCALAR_FIELDS: Array<{
  fieldName: string;
  fieldPath: string;
  confidenceKey?: PolicyFieldConfidenceKey;
  getBefore: (policy: UserPolicy) => unknown;
  getAfter: (input: PolicyInput) => unknown;
}> = [
  {
    fieldName: "provider",
    fieldPath: "policy.provider",
    confidenceKey: "provider",
    getBefore: (p) => p.provider,
    getAfter: (i) => i.provider,
  },
  {
    fieldName: "policy_type",
    fieldPath: "policy.policy_type",
    confidenceKey: "policy_type",
    getBefore: (p) => p.policyType,
    getAfter: (i) => i.policyType,
  },
  {
    fieldName: "policy_category_label",
    fieldPath: "policy.policy_category_label",
    getBefore: (p) => p.policyCategoryLabel,
    getAfter: (i) => i.policyCategoryLabel,
  },
  {
    fieldName: "policy_number",
    fieldPath: "policy.policy_number",
    confidenceKey: "policy_number",
    getBefore: (p) => p.policyNumber,
    getAfter: (i) => i.policyNumber,
  },
  {
    fieldName: "premium_amount",
    fieldPath: "policy.premium_amount",
    confidenceKey: "premium_amount",
    getBefore: (p) => p.premiumAmount,
    getAfter: (i) => i.premiumAmount,
  },
  {
    fieldName: "premium_frequency",
    fieldPath: "policy.premium_frequency",
    confidenceKey: "premium_frequency",
    getBefore: (p) => p.premiumFrequency,
    getAfter: (i) => i.premiumFrequency,
  },
  {
    fieldName: "deductible",
    fieldPath: "policy.deductible",
    confidenceKey: "deductible",
    getBefore: (p) => p.deductible,
    getAfter: (i) => i.deductible,
  },
  {
    fieldName: "start_date",
    fieldPath: "policy.start_date",
    confidenceKey: "start_date",
    getBefore: (p) => p.startDate,
    getAfter: (i) => i.startDate,
  },
  {
    fieldName: "end_date",
    fieldPath: "policy.end_date",
    confidenceKey: "end_date",
    getBefore: (p) => p.endDate,
    getAfter: (i) => i.endDate,
  },
  {
    fieldName: "renewal_date",
    fieldPath: "policy.renewal_date",
    confidenceKey: "renewal_date",
    getBefore: (p) => p.renewalDate,
    getAfter: (i) => i.renewalDate,
  },
  {
    fieldName: "currency",
    fieldPath: "policy.currency",
    confidenceKey: "currency",
    getBefore: (p) => p.currency,
    getAfter: (i) => i.currency,
  },
  {
    fieldName: "coverage_amount",
    fieldPath: "policy.coverage_amount",
    confidenceKey: "coverage_amount",
    getBefore: (p) => p.coverageAmount,
    getAfter: (i) => i.coverageAmount,
  },
  {
    fieldName: "notes",
    fieldPath: "policy.notes",
    getBefore: (p) => p.notes,
    getAfter: (i) => i.notes,
  },
];

const DETAIL_SCALAR_FIELDS: Record<
  TypedPolicyType,
  Array<{ fieldName: string; key: keyof PolicyDetails }>
> = {
  health: [
    { fieldName: "franchise", key: "franchise" },
    { fieldName: "deductible", key: "deductible" },
    { fieldName: "model", key: "model" },
    { fieldName: "hospital_coverage", key: "hospital_coverage" },
    { fieldName: "complementary", key: "complementary" },
    { fieldName: "accident_covered", key: "accident_covered" },
    { fieldName: "telemedicine", key: "telemedicine" },
    { fieldName: "family_doctor_model", key: "family_doctor_model" },
  ],
  car: [
    { fieldName: "plate_number", key: "plate_number" },
    { fieldName: "casco", key: "casco" },
    { fieldName: "bonus_malus", key: "bonus_malus" },
    { fieldName: "annual_km", key: "annual_km" },
  ],
  household: [
    { fieldName: "insured_sum", key: "insured_sum" },
    { fieldName: "glass_coverage", key: "glass_coverage" },
    { fieldName: "theft_coverage", key: "theft_coverage" },
  ],
  liability: [
    { fieldName: "liability_limit", key: "liability_limit" },
    {
      fieldName: "household_members_included",
      key: "household_members_included",
    },
  ],
  legal: [
    { fieldName: "private_legal", key: "private_legal" },
    { fieldName: "traffic_legal", key: "traffic_legal" },
    { fieldName: "coverage_region", key: "coverage_region" },
  ],
  other: [{ fieldName: "generic_details", key: "generic_details" }],
};

type CoveragePlacement = {
  coverageStableKey: string;
  coverageName: string | null;
  coverageKind: string | null;
  personStableKey: string | null;
  personName: string | null;
  insuredNumber: string | null;
  premiumFinal: number | null;
  coverageType: string | null;
  categoryLabel: string | null;
  ownershipConfidence: number | null;
  assignmentSource: string | null;
};

function collectCoveragePlacements(
  details: PolicyDetails,
  familyPremium: number | null
): Map<string, CoveragePlacement> {
  const grouped = computeHealthPolicyGroupingForDetails(details, familyPremium);
  const map = new Map<string, CoveragePlacement>();

  const addCoverage = (
    coverage: PolicyCoverageDetail,
    person: PolicyInsuredPersonDetail | null
  ) => {
    const withKey = withCoverageStableKey(coverage);
    const stableKey =
      withKey.stable_key ?? buildCoverageStableKey(withKey);

    map.set(stableKey, {
      coverageStableKey: stableKey,
      coverageName: withKey.name ?? null,
      coverageKind:
        withKey.coverage_type ?? withKey.category_label ?? details.coverage_kind ?? null,
      personStableKey: person ? buildPersonStableKey(person) : null,
      personName: person?.name ?? withKey.insured_person_name ?? null,
      insuredNumber: person?.insured_number ?? withKey.insured_number ?? null,
      premiumFinal:
        withKey.premium_final ?? withKey.premium_amount ?? null,
      coverageType: withKey.coverage_type ?? null,
      categoryLabel: withKey.category_label ?? null,
      ownershipConfidence: withKey.ownership_confidence ?? null,
      assignmentSource: withKey.assignment_source ?? null,
    });
  };

  for (const person of grouped.people) {
    for (const coverage of person.coverages) {
      addCoverage(coverage, person);
    }
  }

  for (const coverage of grouped.unassignedCoverages) {
    addCoverage(coverage, null);
  }

  return map;
}

function collectPeopleSnapshot(details: PolicyDetails) {
  const people = details.insured_people ?? [];
  const map = new Map<
    string,
    {
      name: string | null;
      insured_number: string | null;
      franchise: number | null;
      model: string | null;
      total_monthly_premium: number | null;
    }
  >();

  for (const person of people) {
    map.set(buildPersonStableKey(person), {
      name: person.name ?? null,
      insured_number: person.insured_number ?? null,
      franchise: person.franchise ?? null,
      model: person.model ?? null,
      total_monthly_premium: person.total_monthly_premium ?? null,
    });
  }

  return map;
}

function assignmentPayload(placement: CoveragePlacement | null) {
  if (!placement?.personStableKey) {
    return {
      insured_person_name: null,
      insured_number: null,
      person_stable_key: null,
      assignment_source: placement?.assignmentSource ?? null,
    };
  }

  return {
    insured_person_name: placement.personName,
    insured_number: placement.insuredNumber,
    person_stable_key: placement.personStableKey,
    assignment_source: placement.assignmentSource ?? "manual",
  };
}

export function buildPolicyScalarCorrectionSignals(
  existing: UserPolicy,
  input: PolicyInput
): CorrectionSignalInput[] {
  const signals: CorrectionSignalInput[] = [];
  const context: CorrectionContext = {
    policy_id: existing.id,
    document_id: existing.documentId,
    provider: input.provider ?? existing.provider,
    policy_type: input.policyType,
  };

  for (const field of POLICY_SCALAR_FIELDS) {
    const before = field.getBefore(existing);
    const after = field.getAfter(input);
    const confidenceKey = field.confidenceKey;

    pushScalarChange(signals, context, {
      fieldName: field.fieldName,
      fieldPath: field.fieldPath,
      before,
      after,
      confidenceBefore: confidenceKey
        ? getFieldConfidence(existing.details, confidenceKey)
        : null,
      sourceContext: confidenceKey
        ? {
            evidence_snippet: getEvidenceSnippet(
              existing.details,
              confidenceKey
            ),
          }
        : null,
    });
  }

  const detailFields = DETAIL_SCALAR_FIELDS[input.policyType] ?? [];

  for (const field of detailFields) {
    const before = existing.details[field.key];
    const after = input.details[field.key];

    pushScalarChange(signals, context, {
      fieldName: field.fieldName,
      fieldPath: `policy.details.${field.fieldName}`,
      before,
      after,
      correctionSource: "policy_field",
    });
  }

  return signals;
}

export function buildHealthDetailsCorrectionSignals(
  existing: UserPolicy,
  input: PolicyInput
): CorrectionSignalInput[] {
  if (existing.policyType !== "health" || input.policyType !== "health") {
    return [];
  }

  const signals: CorrectionSignalInput[] = [];
  const context: CorrectionContext = {
    policy_id: existing.id,
    document_id: existing.documentId,
    provider: input.provider ?? existing.provider,
    policy_type: "health",
  };

  const beforePeople = collectPeopleSnapshot(existing.details);
  const afterPeople = collectPeopleSnapshot(input.details);

  for (const [personKey, afterPerson] of afterPeople) {
    const beforePerson = beforePeople.get(personKey);

    if (!beforePerson) {
      signals.push({
        ...context,
        correction_kind: "added",
        correction_source: "insured_person",
        field_name: "insured_person",
        field_path: "insured_person",
        ai_value_before: null,
        corrected_value_after: afterPerson,
        source_context: { person_stable_key: personKey },
      });
      continue;
    }

    for (const key of [
      "name",
      "insured_number",
      "franchise",
      "model",
      "total_monthly_premium",
    ] as const) {
      if (!valuesEqual(beforePerson[key], afterPerson[key])) {
        signals.push({
          ...context,
          correction_kind: "changed",
          correction_source: "insured_person",
          field_name: key,
          field_path: `insured_person.${key}`,
          ai_value_before: beforePerson[key],
          corrected_value_after: afterPerson[key],
          source_context: { person_stable_key: personKey },
        });
      }
    }
  }

  for (const [personKey, beforePerson] of beforePeople) {
    if (!afterPeople.has(personKey)) {
      signals.push({
        ...context,
        correction_kind: "removed",
        correction_source: "insured_person",
        field_name: "insured_person",
        field_path: "insured_person",
        ai_value_before: beforePerson,
        corrected_value_after: null,
        source_context: { person_stable_key: personKey },
      });
    }
  }

  const beforeCoverages = collectCoveragePlacements(
    existing.details,
    existing.premiumAmount
  );
  const afterCoverages = collectCoveragePlacements(
    input.details,
    input.premiumAmount ?? existing.premiumAmount
  );

  const seenAssignmentKeys = new Set<string>();

  for (const [coverageKey, afterPlacement] of afterCoverages) {
    const beforePlacement = beforeCoverages.get(coverageKey);

    if (!beforePlacement) {
      signals.push({
        ...context,
        correction_kind: "added",
        correction_source: "coverage",
        field_name: "coverage",
        field_path: "coverage",
        ai_value_before: null,
        corrected_value_after: {
          name: afterPlacement.coverageName,
          premium_final: afterPlacement.premiumFinal,
        },
        coverage_stable_key: coverageKey,
        coverage_name: afterPlacement.coverageName,
        coverage_kind: afterPlacement.coverageKind,
      });
      continue;
    }

    const assignmentBefore = assignmentPayload(beforePlacement);
    const assignmentAfter = assignmentPayload(afterPlacement);
    const assignmentChanged =
      normalizeComparable(assignmentBefore.person_stable_key) !==
      normalizeComparable(assignmentAfter.person_stable_key);

    if (assignmentChanged) {
      const dedupKey = `${coverageKey}:${assignmentBefore.person_stable_key ?? "none"}:${assignmentAfter.person_stable_key ?? "none"}`;
      if (!seenAssignmentKeys.has(dedupKey)) {
        seenAssignmentKeys.add(dedupKey);
        const kind =
          assignmentAfter.person_stable_key &&
          !assignmentBefore.person_stable_key
            ? "assigned"
            : !assignmentAfter.person_stable_key &&
                assignmentBefore.person_stable_key
              ? "unassigned"
              : "assigned";

        signals.push({
          ...context,
          correction_type: "coverage_person_assignment",
          correction_kind: kind,
          correction_source: "assignment",
          field_name: "coverage_assignment",
          field_path: "coverage.assignment",
          ai_value_before: assignmentBefore,
          corrected_value_after: assignmentAfter,
          confidence_before: beforePlacement.ownershipConfidence,
          coverage_stable_key: coverageKey,
          coverage_name: afterPlacement.coverageName,
          coverage_kind: afterPlacement.coverageKind,
          previous_assignment: assignmentBefore,
          corrected_assignment: assignmentAfter,
          source_context: {
            ownership_confidence_before: beforePlacement.ownershipConfidence,
            assignment_source_before: beforePlacement.assignmentSource,
          },
        });
      }
    }

    for (const [fieldName, beforeValue, afterValue] of [
      ["name", beforePlacement.coverageName, afterPlacement.coverageName],
      [
        "premium_final",
        beforePlacement.premiumFinal,
        afterPlacement.premiumFinal,
      ],
      [
        "coverage_type",
        beforePlacement.coverageType,
        afterPlacement.coverageType,
      ],
      [
        "category_label",
        beforePlacement.categoryLabel,
        afterPlacement.categoryLabel,
      ],
    ] as const) {
      if (!valuesEqual(beforeValue, afterValue)) {
        signals.push({
          ...context,
          correction_kind: "changed",
          correction_source: "coverage",
          field_name: fieldName,
          field_path: `coverage.${fieldName}`,
          ai_value_before: beforeValue,
          corrected_value_after: afterValue,
          coverage_stable_key: coverageKey,
          coverage_name: afterPlacement.coverageName,
          coverage_kind: afterPlacement.coverageKind,
        });
      }
    }
  }

  for (const [coverageKey, beforePlacement] of beforeCoverages) {
    if (!afterCoverages.has(coverageKey)) {
      signals.push({
        ...context,
        correction_kind: "removed",
        correction_source: "coverage",
        field_name: "coverage",
        field_path: "coverage",
        ai_value_before: {
          name: beforePlacement.coverageName,
          premium_final: beforePlacement.premiumFinal,
        },
        corrected_value_after: null,
        coverage_stable_key: coverageKey,
        coverage_name: beforePlacement.coverageName,
        coverage_kind: beforePlacement.coverageKind,
      });
    }
  }

  return signals;
}

export function buildPolicyUpdateCorrectionSignals(
  existing: UserPolicy,
  input: PolicyInput
): CorrectionSignalInput[] {
  const scalar = buildPolicyScalarCorrectionSignals(existing, input);
  const health =
    existing.policyType === "health"
      ? buildHealthDetailsCorrectionSignals(existing, input)
      : [];

  const deduped = new Map<string, CorrectionSignalInput>();

  for (const signal of [...scalar, ...health]) {
    const key = [
      signal.field_path,
      signal.correction_kind,
      signal.coverage_stable_key ?? "",
      JSON.stringify(signal.ai_value_before),
      JSON.stringify(signal.corrected_value_after),
    ].join("|");
    deduped.set(key, signal);
  }

  return [...deduped.values()];
}

export function buildPolicyConfirmationSignal(
  policy: UserPolicy,
  reviewedAt: string
): CorrectionSignalInput {
  const grouped =
    policy.policyType === "health"
      ? computeHealthPolicyGroupingForDetails(
          policy.details,
          policy.premiumAmount
        )
      : null;

  const peopleCount =
    grouped?.people.length ?? policy.details.insured_people?.length ?? 0;
  const coverageCount = grouped
    ? grouped.people.reduce((sum, person) => sum + person.coverages.length, 0) +
      grouped.unassignedCoverages.length
    : (policy.details.coverages?.length ?? 0) +
      (policy.details.insured_people ?? []).reduce(
        (sum, person) => sum + (person.coverages?.length ?? 0),
        0
      );
  const unassignedCount = grouped?.unassignedCoverages.length ?? 0;

  return {
    policy_id: policy.id,
    document_id: policy.documentId,
    provider: policy.provider,
    policy_type: policy.policyType,
    correction_kind: "confirmed",
    correction_source: "other",
    field_name: "policy_confirmation",
    field_path: "policy.confirmation",
    ai_value_before: null,
    corrected_value_after: {
      provider: policy.provider,
      policyType: policy.policyType,
      premiumAmount: policy.premiumAmount,
      peopleCount,
      coverageCount,
      unassignedCount,
      reviewedAt,
    },
    reviewed_at: reviewedAt,
  };
}

export function buildCoverageAssignmentCorrectionSignal(options: {
  policyId: string;
  documentId: string | null;
  provider: string | null;
  policyType: TypedPolicyType | null;
  coverageStableKey: string;
  coverageName: string | null;
  coverageKind: string | null;
  previousAssignment: Record<string, unknown>;
  correctedAssignment: Record<string, unknown>;
  ownershipConfidenceBefore: number | null;
  sourceContext: Record<string, unknown> | null;
}): CorrectionSignalInput {
  return {
    policy_id: options.policyId,
    document_id: options.documentId,
    provider: options.provider,
    policy_type: options.policyType,
    correction_type: "coverage_person_assignment",
    correction_kind: "assigned",
    correction_source: "assignment",
    field_name: "coverage_assignment",
    field_path: "coverage.assignment",
    ai_value_before: options.previousAssignment,
    corrected_value_after: options.correctedAssignment,
    confidence_before: options.ownershipConfidenceBefore,
    coverage_stable_key: options.coverageStableKey,
    coverage_name: options.coverageName,
    coverage_kind: options.coverageKind,
    previous_assignment: options.previousAssignment,
    corrected_assignment: options.correctedAssignment,
    source_context: options.sourceContext,
  };
}
