/**
 * Italian nouns used in ATLAS copy are mostly feminine in -a, whose plural ends
 * in -e (polizza/polizze). Appending a letter to the singular produces broken
 * words, so callers pass both forms explicitly.
 */
export function pluralIt(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function countIt(count: number, singular: string, plural: string) {
  return `${count} ${pluralIt(count, singular, plural)}`;
}

export const nouns = {
  policy: ["polizza", "polizze"] as const,
  card: ["scheda", "schede"] as const,
  draft: ["bozza", "bozze"] as const,
  category: ["categoria", "categorie"] as const,
  person: ["persona", "persone"] as const,
  coverage: ["copertura", "coperture"] as const,
  company: ["compagnia", "compagnie"] as const,
  action: ["azione", "azioni"] as const,
  analysis: ["analisi", "analisi"] as const,
};

export function countPolicies(count: number) {
  return countIt(count, ...nouns.policy);
}

export function countDrafts(count: number) {
  return countIt(count, ...nouns.draft);
}

export function countCoverages(count: number) {
  return countIt(count, ...nouns.coverage);
}
