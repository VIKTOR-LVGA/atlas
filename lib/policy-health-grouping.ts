import { buildPersonStableKey } from "@/lib/coverage-stable-keys";
import { getCoverageNetPremium as getNetPremium } from "@/lib/coverage-premium";
import type {
  PolicyCoverageDetail,
  PolicyDetails,
  PolicyInsuredPersonDetail,
  PolicyProductDetail,
} from "@/lib/types";

/** Default threshold for weak ownership signals (applies_to, person_index alone). */
export const MIN_OWNERSHIP_CONFIDENCE = 70;

/** Lower bar when structural match is strong and uncontested. */
const MIN_STRONG_OWNERSHIP_CONFIDENCE = 62;

export type InsuredPersonWithCoverages = PolicyInsuredPersonDetail & {
  coverages: PolicyCoverageDetail[];
  computedLineTotal: number | null;
};

export type HealthPolicyGroupedView = {
  people: InsuredPersonWithCoverages[];
  unassignedCoverages: PolicyCoverageDetail[];
  familyPremium: number | null;
  ownershipWarnings: string[];
};

type PersonAnchor = {
  index: number;
  person: InsuredPersonWithCoverages;
  order: number;
  endOrder: number;
  sectionId: string | null;
};

type OwnershipMatch = {
  personIndex: number;
  confidence: number;
  method: string;
};

const STRONG_OWNERSHIP_METHODS = new Set([
  "insured_number",
  "section_id",
  "insured_person_name",
  "nested_person",
  "source_order_sole",
  "source_order",
]);

function normalizeToken(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeInsuredNumber(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, "").replace(/[^\d]/g, "");
}

function normalizeName(value: string | null | undefined) {
  return normalizeToken(value);
}

/** Net premium used for sums (final payable line, not gross). */
export function getCoverageNetPremium(coverage: PolicyCoverageDetail) {
  return getNetPremium(coverage);
}

/** True when details contain health lines worth grouping (old or new schema). */
export function hasHealthPolicyDetailData(details: PolicyDetails) {
  return (
    (details.insured_people?.length ?? 0) > 0 ||
    (details.coverages?.length ?? 0) > 0 ||
    (details.products?.length ?? 0) > 0 ||
    (details.complementary_products?.length ?? 0) > 0
  );
}

export function shouldShowGroupedHealthUI(
  grouped: HealthPolicyGroupedView | null
) {
  if (!grouped) {
    return false;
  }

  return grouped.people.length > 0 || grouped.unassignedCoverages.length > 0;
}

/**
 * Infer insured people from coverage/product lines when insured_people[] is missing.
 */
export function inferInsuredPeopleFromDetails(
  details: PolicyDetails
): PolicyInsuredPersonDetail[] {
  const existing = details.insured_people ?? [];

  if (existing.length > 0) {
    return existing;
  }

  const byKey = new Map<string, PolicyInsuredPersonDetail>();
  let order = 0;

  const register = (
    name: string | null | undefined,
    insuredNumber: string | null | undefined,
    birthDate?: string | null
  ) => {
    const normalizedName = name?.trim() || null;
    const normalizedNumber = insuredNumber?.trim() || null;

    if (!normalizedName && !normalizedNumber) {
      return;
    }

    const draft: PolicyInsuredPersonDetail = {
      name: normalizedName,
      insured_number: normalizedNumber,
      birth_date: birthDate?.trim() || null,
      source_order: order,
    };
    const key = buildPersonStableKey(draft);

    if (byKey.has(key)) {
      return;
    }

    byKey.set(key, draft);
    order += 1000;
  };

  for (const coverage of details.coverages ?? []) {
    register(coverage.insured_person_name, coverage.insured_number);
  }

  for (const product of [
    ...(details.products ?? []),
    ...(details.complementary_products ?? []),
  ]) {
    register(product.insured_person_name, product.insured_number);
  }

  return [...byKey.values()];
}

export function prepareHealthGroupingDetails(
  details: PolicyDetails
): PolicyDetails {
  const insuredPeople = inferInsuredPeopleFromDetails(details);

  if (insuredPeople === details.insured_people) {
    return details;
  }

  return {
    ...details,
    insured_people: insuredPeople,
  };
}

export function getPolicyCoveragesForDisplay(
  details: PolicyDetails
): PolicyCoverageDetail[] {
  const merged: PolicyCoverageDetail[] = [...(details.coverages ?? [])];

  for (const product of [
    ...(details.products ?? []),
    ...(details.complementary_products ?? []),
  ]) {
    merged.push(productToCoverage(product));
  }

  return dedupeCoveragesSemantic(merged);
}

function logHealthPolicyGroupingDebug(
  policyId: string | undefined,
  details: PolicyDetails,
  result: HealthPolicyGroupingComputation
) {
  console.info("[atlas:health-grouping]", {
    policyId: policyId ?? "unknown",
    insuredPeopleInDetails: details.insured_people?.length ?? 0,
    coveragesInDetails: details.coverages?.length ?? 0,
    productsInDetails: details.products?.length ?? 0,
    complementaryProductsInDetails:
      details.complementary_products?.length ?? 0,
    groupedPeople: result.people.length,
    groupedAssignedCoverages: result.people.reduce(
      (sum, person) => sum + person.coverages.length,
      0
    ),
    unassignedCount: result.unassignedCoverages.length,
    ownershipWarnings: result.ownershipWarnings.length,
  });
}

/** Stable key for cross-source dedupe (does not change when assigned to a person). */
export function semanticCoverageKey(coverage: PolicyCoverageDetail) {
  const premium = getCoverageNetPremium(coverage);
  const premiumKey =
    premium !== null && premium !== undefined
      ? premium.toFixed(2)
      : "";

  return [
    normalizeName(coverage.name),
    premiumKey,
    normalizeInsuredNumber(coverage.insured_number),
    (coverage.section_id ?? "").trim().toLowerCase(),
  ].join("|");
}

function coverageRichness(coverage: PolicyCoverageDetail) {
  let score = 0;
  if (coverage.insured_number) score += 2;
  if (coverage.insured_person_name) score += 1;
  if (coverage.section_id) score += 2;
  if (coverage.source_order !== null && coverage.source_order !== undefined) score += 2;
  if (coverage.ownership_confidence !== null && coverage.ownership_confidence !== undefined) {
    score += 1;
  }
  if (coverage.coverage_type) score += 1;
  if (coverage.notes) score += 1;
  return score;
}

function mergeCoverageRecords(
  existing: PolicyCoverageDetail,
  incoming: PolicyCoverageDetail
) {
  if (coverageRichness(incoming) <= coverageRichness(existing)) {
    return existing;
  }

  return { ...existing, ...incoming };
}

function dedupeCoveragesSemantic(coverages: PolicyCoverageDetail[]) {
  const byKey = new Map<string, PolicyCoverageDetail>();

  for (const coverage of coverages.sort(
    (a, b) => (a.source_order ?? 0) - (b.source_order ?? 0)
  )) {
    const key = semanticCoverageKey(coverage);
    const current = byKey.get(key);

    if (!current) {
      byKey.set(key, coverage);
      continue;
    }

    byKey.set(key, mergeCoverageRecords(current, coverage));
  }

  return [...byKey.values()].sort(
    (a, b) => (a.source_order ?? 0) - (b.source_order ?? 0)
  );
}

export function productToCoverage(product: PolicyProductDetail): PolicyCoverageDetail {
  const net = product.premium_final ?? product.premium_amount ?? null;

  return {
    name: product.name,
    policy_type: null,
    coverage_type: product.coverage_type,
    category_label: product.coverage_type,
    premium_gross: product.premium_gross ?? null,
    premium_amount: net,
    premium_final: net,
    premium_frequency: product.premium_frequency,
    discounts: product.discounts ?? [],
    deductible: null,
    franchise: null,
    coverage_amount: null,
    insured_person_name: product.insured_person_name ?? null,
    insured_number: product.insured_number ?? null,
    person_index: product.person_index ?? null,
    applies_to: product.applies_to ?? null,
    section_id: product.section_id ?? null,
    source_page: product.source_page ?? null,
    source_order: product.source_order ?? null,
    confidence: product.confidence,
    ownership_confidence: product.ownership_confidence,
    uncertain: product.uncertain,
    notes: product.notes,
  };
}

function namesMatch(a: string, b: string) {
  if (!a || !b) {
    return false;
  }

  return a === b || a.includes(b) || b.includes(a);
}

function isWeakOwnershipMethod(method: string) {
  const base = method.split("+")[0] ?? method;
  return base === "applies_to_name" || base === "applies_to_number" || base === "person_index";
}

function isContractOrFamilyTotalLine(
  coverage: PolicyCoverageDetail,
  familyPremium: number | null
) {
  const name = normalizeToken(coverage.name);
  const label = normalizeToken(
    `${coverage.category_label ?? ""} ${coverage.notes ?? ""}`
  );
  const combined = `${name} ${label}`;

  if (
    /(totale?\s+(famiglia|contratto|premio|mensile|da\s+pagare)|premio\s+totale|gesamt|total\s+premium|somma\s+totale|total\s+per\s+il\s+contratto)/.test(
      combined
    )
  ) {
    return true;
  }

  const net = getCoverageNetPremium(coverage);

  if (
    familyPremium !== null &&
    net !== null &&
    Math.abs(net - familyPremium) < 0.02 &&
    !coverage.insured_number &&
    !coverage.insured_person_name
  ) {
    return true;
  }

  return false;
}

function buildPersonAnchors(people: InsuredPersonWithCoverages[]): PersonAnchor[] {
  const sorted = people
    .map((person, index) => ({
      index,
      person,
      order: person.source_order ?? index * 1000,
      sectionId: person.section_id?.trim() || null,
    }))
    .sort((a, b) => a.order - b.order);

  return sorted.map((anchor, position, array) => ({
    index: anchor.index,
    person: anchor.person,
    order: anchor.order,
    endOrder: array[position + 1]?.order ?? Number.MAX_SAFE_INTEGER,
    sectionId: anchor.sectionId,
  }));
}

function anchorsForSourceOrder(
  anchors: PersonAnchor[],
  sourceOrder: number
): PersonAnchor[] {
  return anchors.filter(
    (anchor) => sourceOrder >= anchor.order && sourceOrder < anchor.endOrder
  );
}

function scoreOwnershipCandidates(
  anchors: PersonAnchor[],
  coverage: PolicyCoverageDetail
): OwnershipMatch[] {
  const coverageNumber = normalizeInsuredNumber(coverage.insured_number);
  const coverageName = normalizeName(coverage.insured_person_name);
  const coverageSection = coverage.section_id?.trim() || null;
  const appliesTo = normalizeToken(coverage.applies_to);
  const sourceOrder = coverage.source_order;

  const candidates: OwnershipMatch[] = [];

  const push = (personIndex: number, confidence: number, method: string) => {
    const existing = candidates.find((c) => c.personIndex === personIndex);
    if (!existing || confidence > existing.confidence) {
      if (existing) {
        const index = candidates.indexOf(existing);
        candidates[index] = { personIndex, confidence, method };
      } else {
        candidates.push({ personIndex, confidence, method });
      }
    }
  };

  if (coverage.person_index !== null && coverage.person_index !== undefined) {
    const index = Math.round(coverage.person_index);
    if (index >= 0 && index < anchors.length) {
      push(anchors[index].index, 74, "person_index");
    }
  }

  for (const anchor of anchors) {
    const person = anchor.person;
    const personNumber = normalizeInsuredNumber(person.insured_number);
    const personName = normalizeName(person.name);
    const personSection = anchor.sectionId;

    if (coverageNumber && personNumber && coverageNumber === personNumber) {
      push(anchor.index, 98, "insured_number");
      continue;
    }

    if (coverageSection && personSection && coverageSection === personSection) {
      push(anchor.index, 96, "section_id");
      continue;
    }

    if (coverageName && personName && namesMatch(coverageName, personName)) {
      push(anchor.index, 90, "insured_person_name");
      continue;
    }

    if (sourceOrder !== null && sourceOrder !== undefined) {
      if (sourceOrder >= anchor.order && sourceOrder < anchor.endOrder) {
        const distance = sourceOrder - anchor.order;
        const confidence = Math.max(72, 86 - Math.min(14, Math.floor(distance / 50)));
        push(anchor.index, confidence, "source_order");
        continue;
      }
    }

    if (appliesTo && personName && appliesTo.includes(personName)) {
      push(anchor.index, 68, "applies_to_name");
      continue;
    }

    if (appliesTo && personNumber && appliesTo.replace(/\s+/g, "").includes(personNumber)) {
      push(anchor.index, 66, "applies_to_number");
    }
  }

  if (sourceOrder !== null && sourceOrder !== undefined) {
    const inRange = anchorsForSourceOrder(anchors, sourceOrder);
    if (inRange.length === 1) {
      const sole = inRange[0];
      const distance = sourceOrder - sole.order;
      const confidence = Math.max(75, 88 - Math.min(12, Math.floor(distance / 40)));
      push(sole.index, confidence, "source_order_sole");
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

function resolveOwnershipMatch(
  anchors: PersonAnchor[],
  coverage: PolicyCoverageDetail
): OwnershipMatch | null {
  const explicitOwnership = coverage.ownership_confidence;
  const candidates = scoreOwnershipCandidates(anchors, coverage);

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates[0];
  const runnerUp = candidates[1];
  const contested =
    runnerUp !== undefined && best.confidence - runnerUp.confidence < 12;

  let resolved = best;

  if (
    explicitOwnership !== null &&
    explicitOwnership !== undefined &&
    explicitOwnership >= MIN_OWNERSHIP_CONFIDENCE
  ) {
    resolved = {
      ...resolved,
      confidence: Math.max(resolved.confidence, explicitOwnership),
      method: `${resolved.method}+model`,
    };
  }

  if (
    explicitOwnership !== null &&
    explicitOwnership !== undefined &&
    explicitOwnership < MIN_OWNERSHIP_CONFIDENCE &&
    resolved.confidence < MIN_OWNERSHIP_CONFIDENCE &&
    isWeakOwnershipMethod(resolved.method)
  ) {
    return null;
  }

  if (contested && isWeakOwnershipMethod(resolved.method)) {
    return null;
  }

  if (shouldAssignOwnership(resolved, contested)) {
    return resolved;
  }

  if (
    !contested &&
    resolved.method === "source_order" &&
    resolved.confidence >= MIN_STRONG_OWNERSHIP_CONFIDENCE
  ) {
    return resolved;
  }

  return null;
}

function shouldAssignOwnership(match: OwnershipMatch, contested: boolean) {
  if (match.confidence >= MIN_OWNERSHIP_CONFIDENCE) {
    return true;
  }

  if (contested) {
    return false;
  }

  const baseMethod = match.method.split("+")[0] ?? match.method;

  if (STRONG_OWNERSHIP_METHODS.has(baseMethod)) {
    return match.confidence >= MIN_STRONG_OWNERSHIP_CONFIDENCE;
  }

  return false;
}

function sumNetPremiums(items: PolicyCoverageDetail[]) {
  const values = items
    .map(getCoverageNetPremium)
    .filter((value): value is number => value !== null && value !== undefined);

  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
}

function collectGlobalCoverages(
  details: PolicyDetails,
  familyPremium: number | null
) {
  const raw: PolicyCoverageDetail[] = [];

  for (const coverage of details.coverages ?? []) {
    if (!isContractOrFamilyTotalLine(coverage, familyPremium)) {
      raw.push(coverage);
    }
  }

  for (const product of [
    ...(details.complementary_products ?? []),
    ...(details.products ?? []),
  ]) {
    const coverage = productToCoverage(product);
    if (!isContractOrFamilyTotalLine(coverage, familyPremium)) {
      raw.push(coverage);
    }
  }

  return dedupeCoveragesSemantic(raw);
}

function isTrulyAmbiguousUnassigned(coverage: PolicyCoverageDetail) {
  if (coverage.uncertain) {
    return true;
  }

  const ownership = coverage.ownership_confidence;
  if (ownership !== null && ownership !== undefined && ownership < MIN_OWNERSHIP_CONFIDENCE) {
    return true;
  }

  const explicitLow =
    ownership !== null &&
    ownership !== undefined &&
    ownership < MIN_STRONG_OWNERSHIP_CONFIDENCE;

  const noStructuralHint =
    !coverage.insured_number &&
    !coverage.insured_person_name &&
    !coverage.section_id;

  return explicitLow && noStructuralHint;
}

function buildOwnershipWarnings(
  people: InsuredPersonWithCoverages[],
  unassigned: PolicyCoverageDetail[],
  familyPremium: number | null
) {
  const warnings: string[] = [];

  const ambiguous = unassigned.filter(isTrulyAmbiguousUnassigned);

  if (ambiguous.length > 0) {
    warnings.push(
      `${ambiguous.length} copertura${ambiguous.length === 1 ? "" : "e"} da verificare: assegnazione non certa.`
    );
  }

  for (const person of people) {
    if (person.franchise === null || person.franchise === undefined) {
      warnings.push(
        `Franchigia non rilevata per ${person.name ?? "persona assicurata"}.`
      );
    }
  }

  if (familyPremium !== null && people.length > 1) {
    const personTotals = people
      .map(
        (person) =>
          person.total_monthly_premium ?? person.computedLineTotal
      )
      .filter((value): value is number => value !== null && value !== undefined);

    if (personTotals.length >= 2) {
      const sum = Math.round(personTotals.reduce((a, b) => a + b, 0) * 100) / 100;

      if (Math.abs(sum - familyPremium) > 1.5) {
        warnings.push(
          `Il premio contratto (${familyPremium} CHF) non coincide con la somma dei totali per persona (${sum} CHF).`
        );
      }
    }
  }

  return [...new Set(warnings)];
}

export type HealthPolicyGroupingComputation = {
  people: InsuredPersonWithCoverages[];
  unassignedCoverages: PolicyCoverageDetail[];
  ownershipWarnings: string[];
};

export function computeHealthPolicyGroupingForDetails(
  details: PolicyDetails,
  familyPremium: number | null
): HealthPolicyGroupingComputation {
  const prepared = prepareHealthGroupingDetails(details);
  const people: InsuredPersonWithCoverages[] = (prepared.insured_people ?? []).map(
    (person, index) => ({
      ...person,
      source_order: person.source_order ?? index * 1000,
      coverages: dedupeCoveragesSemantic([...(person.coverages ?? [])]),
      computedLineTotal: null,
    })
  );

  if (people.length === 0) {
    return { people: [], unassignedCoverages: [], ownershipWarnings: [] };
  }

  const anchors = buildPersonAnchors(people);
  const assignedSemanticKeys = new Set<string>();

  for (const person of people) {
    const trusted: PolicyCoverageDetail[] = [];

    for (const coverage of person.coverages) {
      const isManual = coverage.assignment_source === "manual";
      const enriched: PolicyCoverageDetail = {
        ...coverage,
        ownership_confidence: isManual
          ? 100
          : Math.max(coverage.ownership_confidence ?? 0, 97),
        insured_person_name: person.name,
        insured_number: person.insured_number ?? coverage.insured_number,
        section_id: coverage.section_id ?? person.section_id ?? null,
        uncertain: isManual ? false : coverage.uncertain,
      };
      const key = semanticCoverageKey(enriched);
      assignedSemanticKeys.add(key);
      trusted.push(enriched);
    }

    person.coverages = dedupeCoveragesSemantic(trusted);
  }

  const pool = collectGlobalCoverages(prepared, familyPremium).filter(
    (coverage) => !assignedSemanticKeys.has(semanticCoverageKey(coverage))
  );

  const unassigned: PolicyCoverageDetail[] = [];

  for (const coverage of pool) {
    const key = semanticCoverageKey(coverage);

    if (assignedSemanticKeys.has(key)) {
      continue;
    }

    const match = resolveOwnershipMatch(anchors, coverage);

    if (match) {
      const person = people[match.personIndex];
      person.coverages = dedupeCoveragesSemantic([
        ...person.coverages,
        {
          ...coverage,
          ownership_confidence: match.confidence,
          insured_person_name: person.name,
          insured_number: person.insured_number ?? coverage.insured_number,
          uncertain: false,
        },
      ]);
      assignedSemanticKeys.add(key);
    } else {
      const bestCandidate = scoreOwnershipCandidates(anchors, coverage)[0];
      unassigned.push({
        ...coverage,
        ownership_confidence:
          coverage.ownership_confidence ??
          bestCandidate?.confidence ??
          null,
        uncertain:
          coverage.uncertain ||
          isTrulyAmbiguousUnassigned({
            ...coverage,
            ownership_confidence:
              coverage.ownership_confidence ??
              bestCandidate?.confidence ??
              null,
          }),
      });
    }
  }

  for (const person of people) {
    const lineTotal = sumNetPremiums(person.coverages);
    person.computedLineTotal = lineTotal;

    if (
      person.total_monthly_premium === null ||
      person.total_monthly_premium === undefined
    ) {
      person.total_monthly_premium = lineTotal;
    }

    if (person.premium_amount === null || person.premium_amount === undefined) {
      person.premium_amount = person.total_monthly_premium;
    }
  }

  const unassignedCoverages = dedupeCoveragesSemantic(unassigned).filter(
    (coverage) => {
      const key = semanticCoverageKey(coverage);
      for (const person of people) {
        if (person.coverages.some((c) => semanticCoverageKey(c) === key)) {
          return false;
        }
      }
      return true;
    }
  );

  const ownershipWarnings = buildOwnershipWarnings(
    people,
    unassignedCoverages,
    familyPremium
  );

  return { people, unassignedCoverages, ownershipWarnings };
}

/**
 * Assigns coverages to insured people using confidence-ranked ownership keys.
 */
export function enrichHealthPolicyOwnership(
  details: PolicyDetails,
  familyPremiumAmount: number | null
): PolicyDetails {
  const familyPremium =
    familyPremiumAmount ??
    details.premium_summary?.final_monthly ??
    details.premium_summary?.total_monthly ??
    null;

  const prepared = prepareHealthGroupingDetails(details);

  if ((prepared.insured_people ?? []).length === 0) {
    return details;
  }

  const { people, ownershipWarnings } = computeHealthPolicyGroupingForDetails(
    prepared,
    familyPremium
  );
  const existingWarnings = details.extraction_metadata?.warnings ?? [];

  return {
    ...prepared,
    insured_people: people.map(({ computedLineTotal, ...person }) => {
      void computedLineTotal;
      return person;
    }),
    extraction_metadata: {
      ...prepared.extraction_metadata,
      warnings: [...new Set([...existingWarnings, ...ownershipWarnings])].slice(0, 14),
    },
  };
}

export function getHealthPolicyGroupedView(
  details: PolicyDetails,
  familyPremiumAmount: number | null,
  policyId?: string
): HealthPolicyGroupedView {
  const familyPremium =
    familyPremiumAmount ??
    details.premium_summary?.final_monthly ??
    details.premium_summary?.total_monthly ??
    null;

  const prepared = prepareHealthGroupingDetails(details);
  const computation = computeHealthPolicyGroupingForDetails(prepared, familyPremium);

  logHealthPolicyGroupingDebug(policyId, prepared, computation);

  return {
    people: computation.people,
    unassignedCoverages: computation.unassignedCoverages,
    familyPremium,
    ownershipWarnings: computation.ownershipWarnings,
  };
}
