import type {
  PolicyCoverageDetail,
  PolicyDetails,
  PolicyInsuredPersonDetail,
} from "@/lib/types";

type OverviewPremiums = {
  name: string;
  insuredNumber: string;
  total: number;
  base: number;
  complementary: number;
};

function amount(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace("'", "").replace("’", "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function lastAmount(text: string, pattern: RegExp) {
  let result: number | null = null;
  for (const match of text.matchAll(pattern)) {
    result = amount(match[1]);
  }
  return result;
}

function premiumsInBlock(text: string) {
  const base = lastAmount(
    text,
    /Assicurazione\s+di\s+base\s+([\d'’]+[.,]\d{2})/gi
  );
  const complementary = lastAmount(
    text,
    /Assicurazione\s+integrativa\s+([\d'’]+[.,]\d{2})/gi
  );
  const total = lastAmount(
    text,
    /T\s*o\s*t\s*a\s*l\s*e\s+([\d'’]+[.,]\d{2})/gi
  );

  if (base === null || complementary === null || total === null) return null;
  if (Math.abs(base + complementary - total) >= 0.02) return null;
  return { base, complementary, total };
}

/**
 * Reconciles the explicit Italian health-policy premium overview after LLM
 * extraction. pdf2json can return this table in reverse visual order, so both
 * the preceding and following person blocks are considered.
 */
export function extractItalianHealthPremiumOverview(text: string): OverviewPremiums[] {
  const personPattern =
    /([A-ZÀ-ÖØ-Ý][^\n,]{1,80}),\s*\d{2}[./]\d{2}[./]\d{4},\s*n\.\s*d['’]assicurato\s*([\d ]{6,})/g;
  const matches = [...text.matchAll(personPattern)];
  const rows: OverviewPremiums[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const previousEnd =
      index === 0
        ? Math.max(0, start - 700)
        : (matches[index - 1].index ?? 0) + matches[index - 1][0].length;
    const nextStart =
      index + 1 < matches.length ? (matches[index + 1].index ?? text.length) : end + 700;
    const premiums =
      premiumsInBlock(text.slice(previousEnd, start)) ??
      premiumsInBlock(text.slice(end, Math.min(text.length, nextStart)));

    if (!premiums) continue;
    rows.push({
      name: match[1].trim(),
      insuredNumber: match[2].replace(/\s+/g, ""),
      ...premiums,
    });
  }

  return rows;
}

function normalizedName(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPerson(person: PolicyInsuredPersonDetail, row: OverviewPremiums) {
  const number = (person.insured_number ?? "").replace(/\D/g, "");
  return (
    (number.length > 0 && number === row.insuredNumber) ||
    normalizedName(person.name) === normalizedName(row.name)
  );
}

export function reconcileHealthPremiumOverview(
  details: PolicyDetails,
  extractedText: string,
  familyPremium: number | null
): PolicyDetails {
  const people = details.insured_people ?? [];
  const rows = extractItalianHealthPremiumOverview(extractedText);

  if (people.length < 2 || rows.length !== people.length) return details;
  const rowSum = Math.round(rows.reduce((sum, row) => sum + row.total, 0) * 100) / 100;
  if (familyPremium !== null && Math.abs(rowSum - familyPremium) >= 0.02) return details;
  if (people.some((person) => !rows.some((row) => matchesPerson(person, row)))) {
    return details;
  }

  return {
    ...details,
    insured_people: people.map((person) => {
      const row = rows.find((candidate) => matchesPerson(person, candidate));
      if (!row) return person;
      return {
        ...person,
        premium_amount: row.total,
        premium_frequency: "monthly",
        total_monthly_premium: row.total,
        base_premium: row.base,
        complementary_premium: row.complementary,
      };
    }),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function evidenceForCoverage(coverage: PolicyCoverageDetail, text: string) {
  if (coverage.evidence?.trim()) return coverage.evidence;
  const label = (coverage.original_label ?? coverage.name).trim();
  if (label.length < 6) return coverage.evidence ?? null;
  const words = label.split(/\s+/).filter(Boolean).slice(0, 14);
  const match = new RegExp(words.map(escapeRegExp).join("\\s+"), "i").exec(text);
  if (!match || match.index === undefined) return coverage.evidence ?? null;
  const lineStart = text.lastIndexOf("\n", match.index) + 1;
  const lineEndIndex = text.indexOf("\n", match.index + match[0].length);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  return text.slice(lineStart, lineEnd).replace(/\s+/g, " ").trim().slice(0, 280);
}

/** Adds evidence only when the coverage label is literally present in the PDF text. */
export function enrichHealthCoverageEvidence(
  details: PolicyDetails,
  extractedText: string
): PolicyDetails {
  const enrich = (coverage: PolicyCoverageDetail): PolicyCoverageDetail => ({
    ...coverage,
    evidence: evidenceForCoverage(coverage, extractedText),
  });

  return {
    ...details,
    coverages: details.coverages?.map(enrich),
    insured_people: details.insured_people?.map((person) => ({
      ...person,
      coverages: person.coverages?.map(enrich),
    })),
  };
}
