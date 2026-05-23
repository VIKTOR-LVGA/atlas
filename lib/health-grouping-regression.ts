/**
 * Regression fixture for Swiss multi-person health PDFs (Helsana-style layout).
 * Run: npx --yes tsx lib/health-grouping-regression.ts
 */
import {
  getHealthPolicyGroupedView,
  MIN_OWNERSHIP_CONFIDENCE,
  semanticCoverageKey,
} from "@/lib/policy-health-grouping";
import type { PolicyCoverageDetail, PolicyDetails } from "@/lib/types";

/** Example layout: two persons, family total CHF 759.35 — not insurer-specific. */
export const swissFamilyHealthFixture: PolicyDetails = {
  premium_summary: { final_monthly: 759.35, currency: "CHF" },
  insured_people: [
    {
      name: "Armir Hoti",
      insured_number: "95272411",
      section_id: "person-0",
      source_order: 100,
      total_monthly_premium: 589.35,
      franchise: 2500,
      model: "PREMED-24",
      coverages: [
        {
          name: "Assicurazione di base PREMED-24",
          category_label: "LAMal",
          coverage_type: "lamal",
          premium_final: 581.85,
          premium_amount: 581.85,
          source_order: 105,
        },
      ],
    },
    {
      name: "Lorik Hoti",
      insured_number: "101398331",
      section_id: "person-1",
      source_order: 1100,
      total_monthly_premium: 170,
      franchise: 300,
      model: "BeneFit PLUS",
      coverages: [
        {
          name: "Assicurazione di base BeneFit PLUS",
          category_label: "LAMal",
          coverage_type: "lamal",
          premium_final: 127.25,
          premium_amount: 127.25,
          source_order: 1105,
        },
      ],
    },
  ],
  coverages: [
    {
      name: "Assicurazione di base PREMED-24",
      category_label: "LAMal",
      coverage_type: "lamal",
      premium_final: 581.85,
      premium_amount: 581.85,
      insured_number: "95272411",
      section_id: "person-0",
      source_order: 110,
      ownership_confidence: 95,
    },
    {
      name: "WORLD",
      category_label: "Viaggio",
      coverage_type: "travel",
      premium_final: 7.5,
      premium_amount: 7.5,
      insured_number: "95272411",
      source_order: 120,
      ownership_confidence: 92,
    },
    {
      name: "Assicurazione di base BeneFit PLUS",
      category_label: "LAMal",
      coverage_type: "lamal",
      premium_final: 127.25,
      premium_amount: 127.25,
      insured_number: "101398331",
      section_id: "person-1",
      source_order: 1110,
      ownership_confidence: 95,
    },
    {
      name: "COMPLETA",
      category_label: "Complementare",
      coverage_type: "lca",
      premium_final: 28.9,
      premium_amount: 28.9,
      insured_number: "101398331",
      source_order: 1120,
      ownership_confidence: 90,
    },
    {
      name: "HOSPITAL Privato",
      category_label: "Ospedale",
      coverage_type: "hospital",
      premium_final: 13.85,
      premium_amount: 13.85,
      insured_number: "101398331",
      source_order: 1130,
      ownership_confidence: 88,
    },
    {
      name: "Advocare EXTRA",
      category_label: "Protezione giuridica",
      coverage_type: "legal",
      premium_final: 19.9,
      premium_amount: 19.9,
      insured_number: "101398331",
      source_order: 1140,
      ownership_confidence: 85,
    },
    {
      name: "Premio totale famiglia",
      premium_final: 759.35,
      premium_amount: 759.35,
      source_order: 9999,
    },
  ],
  products: [
    {
      name: "WORLD",
      coverage_type: "travel",
      premium_final: 7.5,
      premium_amount: 7.5,
      insured_number: "95272411",
      source_order: 120,
    },
    {
      name: "COMPLETA",
      coverage_type: "lca",
      premium_final: 28.9,
      premium_amount: 28.9,
      insured_number: "101398331",
      source_order: 1120,
    },
  ],
};

function personHasCoverageNamed(
  coverages: PolicyCoverageDetail[],
  fragment: string
) {
  const needle = fragment.toLowerCase();
  return coverages.some((c) => c.name.toLowerCase().includes(needle));
}

function assignedKeysOverlapUnassigned(
  people: { coverages: PolicyCoverageDetail[] }[],
  unassigned: PolicyCoverageDetail[]
) {
  const assigned = new Set<string>();
  for (const person of people) {
    for (const coverage of person.coverages) {
      assigned.add(semanticCoverageKey(coverage));
    }
  }

  return unassigned.filter((c) => assigned.has(semanticCoverageKey(c)));
}

export function runHealthGroupingRegressionChecks(): string[] {
  const errors: string[] = [];
  const view = getHealthPolicyGroupedView(swissFamilyHealthFixture, 759.35);

  if (view.people.length !== 2) {
    errors.push(`Expected 2 people, got ${view.people.length}`);
  }

  const armir = view.people.find((p) => p.name?.includes("Armir"));
  const lorik = view.people.find((p) => p.name?.includes("Lorik"));

  if (!armir || armir.coverages.length < 2) {
    errors.push(`Armir should have at least 2 coverages, got ${armir?.coverages.length ?? 0}`);
  }

  if (!lorik || lorik.coverages.length < 4) {
    errors.push(`Lorik should have at least 4 coverages, got ${lorik?.coverages.length ?? 0}`);
  }

  if (!armir || !personHasCoverageNamed(armir.coverages, "world")) {
    errors.push("WORLD should be assigned to Armir");
  }

  if (!lorik || !personHasCoverageNamed(lorik.coverages, "completa")) {
    errors.push("COMPLETA should be assigned to Lorik");
  }

  if (!lorik || !personHasCoverageNamed(lorik.coverages, "hospital")) {
    errors.push("HOSPITAL Privato should be assigned to Lorik");
  }

  if (!lorik || !personHasCoverageNamed(lorik.coverages, "advocare")) {
    errors.push("Advocare EXTRA should be assigned to Lorik");
  }

  if (!armir || !personHasCoverageNamed(armir.coverages, "premed")) {
    errors.push("Base PREMED-24 should be assigned to Armir");
  }

  if (!lorik || !personHasCoverageNamed(lorik.coverages, "benefit")) {
    errors.push("Base BeneFit PLUS should be assigned to Lorik");
  }

  const familyLineAssigned = view.people.some((p) =>
    p.coverages.some((c) => c.name.toLowerCase().includes("totale famiglia"))
  );
  if (familyLineAssigned) {
    errors.push("Family total line should not be assigned to a person");
  }

  if (view.familyPremium !== 759.35) {
    errors.push(`Family premium should be 759.35, got ${view.familyPremium}`);
  }

  const overlaps = assignedKeysOverlapUnassigned(view.people, view.unassignedCoverages);
  if (overlaps.length > 0) {
    errors.push(
      `Coverages duplicated in assigned and unassigned: ${overlaps.map((c) => c.name).join(", ")}`
    );
  }

  const maxUnassigned = 2;
  if (view.unassignedCoverages.length > maxUnassigned) {
    errors.push(
      `Expected at most ${maxUnassigned} unassigned coverages, got ${view.unassignedCoverages.length}: ${view.unassignedCoverages.map((c) => c.name).join(", ")}`
    );
  }

  const armirSum =
    armir?.coverages.reduce((s, c) => s + (c.premium_final ?? 0), 0) ?? 0;
  if (Math.abs(armirSum - 589.35) > 0.5) {
    errors.push(`Armir line sum expected ~589.35, got ${armirSum}`);
  }

  if (MIN_OWNERSHIP_CONFIDENCE < 50) {
    errors.push("MIN_OWNERSHIP_CONFIDENCE unexpectedly low");
  }

  return errors;
}

const isMainModule = process.argv[1]?.includes("health-grouping-regression");

if (isMainModule) {
  const errors = runHealthGroupingRegressionChecks();
  if (errors.length === 0) {
    const view = getHealthPolicyGroupedView(swissFamilyHealthFixture, 759.35);
    console.log("health-grouping-regression: OK");
    console.log(`  unassigned: ${view.unassignedCoverages.length}`);
  } else {
    console.error("health-grouping-regression: FAILED");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }
}
