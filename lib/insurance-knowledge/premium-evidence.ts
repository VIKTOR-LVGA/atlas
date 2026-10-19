/** A conservative cross-check of explicit final Swiss policy premiums. */
export type ExplicitPremiumTotal = {
  amount: number;
  frequency: "monthly" | "annual";
  sourceLabel: string;
};

const totalPatterns: Array<{ pattern: RegExp; frequency: "monthly" | "annual"; priority: number }> = [
  { pattern: /^\s*(totale\s+(?:premio\s+)?mensile\s+LAMal\s*\+\s*LCA)\s*:?\s*(?:CHF\s*)?([0-9][0-9'’ .]*[.,][0-9]{2})\s*$/i, frequency: "monthly", priority: 0 },
  { pattern: /^\s*(totale\s+premio\s+mensile|premio\s+mensile\s+totale)\s*:?\s*(?:CHF\s*)?([0-9][0-9'’ .]*[.,][0-9]{2})\s*$/i, frequency: "monthly", priority: 1 },
  { pattern: /^\s*(totale\s+premio\s+annuo|totale\s+premio\s+annuale|jahresprämie\s+total|total\s+annual\s+premium)\s*:?\s*(?:CHF\s*)?([0-9][0-9'’ .]*[.,][0-9]{2})\s*$/i, frequency: "annual", priority: 1 },
];

function parseAmount(input: string): number | null {
  const clean = input.replace(/[\s'’]/g, "");
  const amount = Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : null;
}

/**
 * Detects only a *clearly labelled* final total, never sums individual premiums.
 * Conflicting totals at the same specificity return null (manual review).
 */
export function findExplicitSwissPremiumTotal(text: string): ExplicitPremiumTotal | null {
  const matches: Array<ExplicitPremiumTotal & { priority: number }> = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    // pdf2json may emit a table label and its monetary value on adjacent lines.
    // Only join an immediately following standalone CHF amount; never a freeform row.
    const next = lines[i + 1] ?? "";
    const isAmountOnly = /^\s*(?:CHF\s*)?[0-9][0-9'’ .]*[.,][0-9]{2}\s*$/.test(next);
    const alternatives = isAmountOnly ? [lines[i], lines[i] + " " + next.trim()] : [lines[i]];
    for (const item of totalPatterns) {
      const match = alternatives.map((line) => line.match(item.pattern)).find(Boolean);
      if (!match) continue;
      const amount = parseAmount(match[2]);
      if (amount !== null) matches.push({
        amount, sourceLabel: match[1], frequency: item.frequency, priority: item.priority,
      });
    }
  }
  if (matches.length === 0) return null;
  const firstPriority = Math.min(...matches.map((item) => item.priority));
  const winners = matches.filter((item) => item.priority === firstPriority);
  if (winners.some((item) => item.amount !== winners[0].amount || item.frequency !== winners[0].frequency)) {
    return null;
  }
  const first = winners[0];
  return { amount: first.amount, frequency: first.frequency, sourceLabel: first.sourceLabel };
}
