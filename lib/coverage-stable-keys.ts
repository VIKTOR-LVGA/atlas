import { getCoverageNetPremium } from "@/lib/coverage-premium";
import type {
  PolicyCoverageDetail,
  PolicyInsuredPersonDetail,
  PolicyProductDetail,
} from "@/lib/types";

function normalizeToken(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInsuredNumber(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, "").replace(/[^\d]/g, "");
}

/** Deterministic key for manual assignment and learning (not array index). */
export function buildCoverageStableKey(coverage: {
  name: string;
  coverage_type?: string | null;
  category_label?: string | null;
  premium_final?: number | null;
  premium_amount?: number | null;
  source_order?: number | null;
  source_page?: number | null;
}) {
  const premium = getCoverageNetPremium(coverage as PolicyCoverageDetail);
  const premiumKey =
    premium !== null && premium !== undefined ? premium.toFixed(2) : "";
  const kind = normalizeToken(
    coverage.coverage_type ?? coverage.category_label ?? ""
  );

  return [
    normalizeToken(coverage.name),
    kind,
    premiumKey,
    String(coverage.source_order ?? ""),
    String(coverage.source_page ?? ""),
  ].join("|");
}

export function buildPersonStableKey(person: {
  name?: string | null;
  insured_number?: string | null;
  birth_date?: string | null;
}) {
  return [
    normalizeToken(person.name),
    normalizeInsuredNumber(person.insured_number),
    (person.birth_date ?? "").trim(),
  ].join("|");
}

export function withCoverageStableKey<T extends PolicyCoverageDetail>(
  coverage: T
): T & { stable_key: string } {
  return {
    ...coverage,
    stable_key: coverage.stable_key ?? buildCoverageStableKey(coverage),
  };
}

export function withPersonStableKey<T extends PolicyInsuredPersonDetail>(
  person: T
): T & { stable_key: string } {
  return {
    ...person,
    stable_key: person.stable_key ?? buildPersonStableKey(person),
  };
}

export function productMatchesStableKey(
  product: PolicyProductDetail,
  stableKey: string
) {
  return buildCoverageStableKey({
    name: product.name,
    coverage_type: product.coverage_type,
    premium_final: product.premium_final,
    premium_amount: product.premium_amount,
    source_order: product.source_order,
    source_page: product.source_page,
  }) === stableKey;
}

export function coverageMatchesStableKey(
  coverage: PolicyCoverageDetail,
  stableKey: string
) {
  return buildCoverageStableKey(coverage) === stableKey;
}
