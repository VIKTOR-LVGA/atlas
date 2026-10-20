import { findSwissCgaSourceCandidates, type SwissCgaLanguage } from "./cga-pdf-sources";
export type CgaClause = { sourceUrl: string; insurer: string; product: string; language: SwissCgaLanguage; editionFrom: string | null; page: number; section: string; text: string; checkedAgainstSource: boolean };
export type CgaSearchResult = { status: "matched" | "edition_unverified" | "not_found"; matches: { clause: CgaClause; score: number }[]; warning: string };
const tokens = (s: string) => new Set(s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(x => x.length > 2));
/** Requires verified clause input from a separately authorized ingestion pipeline. Never invents clauses from URLs. */
export function searchSwissCgaClauses(input: { insurer: string; product: string; language: SwissCgaLanguage; question: string; contractEffectiveOn?: string; requiredEditionFrom?: string; clauses: readonly CgaClause[]; limit?: number }): CgaSearchResult {
 const sources = findSwissCgaSourceCandidates(input);
 const urls = new Set(sources.map(x => x.url));
 const words = tokens(input.question);
 const matches = input.clauses.filter(c => c.checkedAgainstSource && urls.has(c.sourceUrl) && c.insurer.toLowerCase() === input.insurer.toLowerCase() && c.product === input.product && c.language === input.language && c.page > 0 && Number.isInteger(c.page) && c.section.trim() !== "" && c.text.trim() !== "" && (!input.requiredEditionFrom || c.editionFrom === input.requiredEditionFrom)).map(clause => { const haystack = tokens(clause.section + " " + clause.text); let score = 0; for (const w of words) if (haystack.has(w)) score++; return { clause, score }; }).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.clause.page-b.clause.page).slice(0, Math.min(10, Math.max(1,input.limit ?? 5)));
 return { status: matches.length === 0 ? "not_found" : input.requiredEditionFrom ? "matched" : "edition_unverified", matches, warning: matches.length === 0 ? "Nessuna clausola verificata trovata; non dedurre coperture." : !input.requiredEditionFrom ? "Edizione contrattuale non verificata." : "Verificare CPA/CSA, esclusioni e polizza personale." };
}
export function formatSwissCgaClauseCitations(result: CgaSearchResult): string[] { return result.matches.map(({clause:c}) => [c.insurer,c.product,c.language,c.editionFrom ?? "edizione da verificare","sezione "+c.section,"p. "+c.page,c.sourceUrl].join(" | ")); }
