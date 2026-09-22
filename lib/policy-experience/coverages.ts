import type { PolicyCoverageDetail } from "@/lib/types";
import { normalizeCoverageLabel } from "@/lib/insurance-knowledge";

export type CoverageGroupId =
  | "essential"
  | "casco"
  | "events"
  | "extras"
  | "people_assistance"
  | "other";

export const coverageGroupLabels: Record<CoverageGroupId, string> = {
  essential: "Essenziali",
  casco: "Casco",
  events: "Eventi",
  extras: "Extra",
  people_assistance: "Persone e assistenza",
  other: "Altre",
};

const GROUP_BY_CANONICAL: Record<string, CoverageGroupId> = {
  motor_liability: "essential",
  collision_damage: "casco",
  comprehensive_casco: "casco",
  partial_casco: "casco",
  theft: "events",
  fire: "events",
  natural_hazards: "events",
  forces_of_nature: "events",
  vandalism: "events",
  animal_collision: "events",
  marten_damage: "events",
  parking_damage: "extras",
  glass_damage: "extras",
  bonus_protection: "casco",
  occupants_accident: "people_assistance",
  roadside_assistance: "people_assistance",
  private_legal: "people_assistance",
  traffic_legal: "people_assistance",
  cyber: "extras",
};

export type CoverageStatusTone = "included" | "excluded" | "uncertain";

export function getCoverageStatusTone(
  coverage: PolicyCoverageDetail
): CoverageStatusTone {
  if (coverage.coverage_status === "excluded") return "excluded";
  if (coverage.coverage_status === "unknown" || coverage.uncertain) return "uncertain";
  if (
    coverage.coverage_status === "included" ||
    coverage.coverage_status === "conditional" ||
    coverage.coverage_status == null
  ) {
    return "included";
  }
  return "uncertain";
}

export type DisplayCoverage = {
  key: string;
  name: string;
  originalLabel: string | null;
  canonicalType: string | null;
  tone: CoverageStatusTone;
  premium: number | null;
  deductible: number | null;
  limit: number | null;
  notes: string | null;
  features: string[];
  children: DisplayCoverage[];
};

function coverageKey(coverage: PolicyCoverageDetail, index: number) {
  return `${coverage.canonical_type ?? "x"}:${coverage.name ?? index}`;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

/**
 * Group + lightly nest motor coverages for Consumer UX.
 * Preserves original labels; does not mutate source data.
 */
export function buildCoverageDisplayTree(
  coverages: PolicyCoverageDetail[]
): Array<{ groupId: CoverageGroupId; label: string; items: DisplayCoverage[] }> {
  const items: DisplayCoverage[] = coverages.map((coverage, index) => {
    const normalized = coverage.canonical_type
      ? { canonicalType: coverage.canonical_type }
      : normalizeCoverageLabel(coverage.name ?? coverage.original_label ?? "");
    const canonical =
      coverage.canonical_type ??
      ("canonicalType" in normalized ? normalized.canonicalType : null);

    return {
      key: coverageKey(coverage, index),
      name: coverage.name ?? coverage.original_label ?? "Copertura",
      originalLabel: coverage.original_label ?? null,
      canonicalType: canonical,
      tone: getCoverageStatusTone(coverage),
      premium:
        asNumber(coverage.premium_final) ?? asNumber(coverage.premium_amount),
      deductible:
        asNumber(coverage.deductible) ?? asNumber(coverage.franchise),
      limit: asNumber(coverage.coverage_amount),
      notes: coverage.notes ?? null,
      features: [],
      children: [],
    };
  });

  // Nest bonus protection under RC / collision when both present
  const bonus = items.filter((i) => i.canonicalType === "bonus_protection");
  const parents = items.filter((i) => i.canonicalType !== "bonus_protection");
  for (const feature of bonus) {
    const host =
      parents.find((p) => p.canonicalType === "motor_liability") ??
      parents.find((p) => p.canonicalType === "collision_damage");
    if (host && feature.tone === "included") {
      host.features.push(feature.name);
    } else {
      parents.push(feature);
    }
  }

  // Nest partial-casco events under partial_casco when parent exists
  const eventTypes = new Set([
    "theft",
    "fire",
    "natural_hazards",
    "forces_of_nature",
    "vandalism",
    "animal_collision",
    "marten_damage",
    "glass_damage",
  ]);
  const partial = parents.find((p) => p.canonicalType === "partial_casco");
  const rest: DisplayCoverage[] = [];
  for (const item of parents) {
    if (
      partial &&
      item !== partial &&
      item.canonicalType &&
      eventTypes.has(item.canonicalType) &&
      item.tone === "included"
    ) {
      partial.children.push(item);
    } else if (item.canonicalType !== "bonus_protection" || !partial) {
      if (item.canonicalType === "bonus_protection" && partial) {
        // already handled
      } else {
        rest.push(item);
      }
    }
  }

  const grouped = new Map<CoverageGroupId, DisplayCoverage[]>();
  for (const item of rest) {
    const groupId =
      (item.canonicalType && GROUP_BY_CANONICAL[item.canonicalType]) || "other";
    const list = grouped.get(groupId) ?? [];
    list.push(item);
    grouped.set(groupId, list);
  }

  const order: CoverageGroupId[] = [
    "essential",
    "casco",
    "events",
    "extras",
    "people_assistance",
    "other",
  ];

  return order
    .filter((id) => (grouped.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      groupId: id,
      label: coverageGroupLabels[id],
      items: grouped.get(id) ?? [],
    }));
}

/** Detect duplicate consumer labels (e.g. plate shown twice in a list). */
export function findDuplicateDisplayLabels(labels: string[]): string[] {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const key = label.trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([label]) => label);
}
