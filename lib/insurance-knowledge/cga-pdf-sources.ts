/**
 * Official insurer PDF links and disclosed editions. Index, not a copied corpus.
 * A listed date is an edition start, never evidence of applicability to a
 * policyholder's historic contract. null means we could not confirm an edition.
 * Do not use these general conditions as proof of purchased cover.
 */
export type SwissCgaLanguage = "it" | "de" | "fr";
export type SwissCgaSource = {
  insurer: string;
  product: string;
  language: SwissCgaLanguage;
  editionFrom: string | null;
  documentKind: string;
  url: string;
  verifiedOn: "2026-10-20";
};

export const swissCgaPdfSources: readonly SwissCgaSource[] = [
  { insurer: "helsana", product: "health-supplementary-cga", language: "it", editionFrom: "2027-01-01", documentKind: "CGA", url: "https://www.helsana.ch/dam/it/pdf/privati/condizioni-assicurazione/assicurazioni-integrative-malattia.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "health-supplementary-cga", language: "de", editionFrom: "2027-01-01", documentKind: "AVB", url: "https://www.helsana.ch/dam/de/pdf/private/versicherungsbedingungen/krankenzusatzversicherungen.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "health-supplementary-cga", language: "fr", editionFrom: "2027-01-01", documentKind: "CGA", url: "https://www.helsana.ch/dam/fr/pdf/prives/conditions-assurance/assurances-maladie-complementaires.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "premed-24", language: "it", editionFrom: null, documentKind: "CA", url: "https://www.helsana.ch/dam/it/pdf/privati/condizioni-assicurazione/premed-24.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "premed-24", language: "de", editionFrom: null, documentKind: "VB", url: "https://www.helsana.ch/dam/de/pdf/private/versicherungsbedingungen/premed-24.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "premed-24", language: "fr", editionFrom: null, documentKind: "CA", url: "https://www.helsana.ch/dam/fr/pdf/prives/conditions-assurance/premed-24.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "hospital-private", language: "it", editionFrom: null, documentKind: "CSA", url: "https://www.helsana.ch/dam/it/pdf/privati/condizioni-assicurazione/hospital-semiprivato-privato.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "hospital-private", language: "de", editionFrom: null, documentKind: "ZVB", url: "https://www.helsana.ch/dam/de/pdf/private/versicherungsbedingungen/hospital-halbprivat-privat.pdf", verifiedOn: "2026-10-20" },
  { insurer: "helsana", product: "hospital-private", language: "fr", editionFrom: null, documentKind: "CSA", url: "https://www.helsana.ch/dam/fr/pdf/prives/conditions-assurance/hospital-demiprivee-privee.pdf", verifiedOn: "2026-10-20" },
  { insurer: "allianz", product: "motor", language: "it", editionFrom: "2024-06-01", documentKind: "CG", url: "https://www.allianz.ch/content/dam/onemarketing/azch/common/allianz/it/allianz-assicurazione_veicoli-condizioni_generali.pdf", verifiedOn: "2026-10-20" },
  { insurer: "allianz", product: "motor", language: "de", editionFrom: "2024-06-01", documentKind: "AB", url: "https://www.allianz.ch/content/dam/onemarketing/azch/common/allianz/de/allianz-fahrzeugversicherung_allgemeine_bedingungen.pdf", verifiedOn: "2026-10-20" },
  { insurer: "allianz", product: "motor", language: "fr", editionFrom: "2024-06-01", documentKind: "CG", url: "https://www.allianz.ch/content/dam/onemarketing/azch/common/allianz/fr/allianz-assurance_des_vehicules-conditions_generales.pdf", verifiedOn: "2026-10-20" },
  { insurer: "axa", product: "motor-optima-flex", language: "it", editionFrom: "2025-10-01", documentKind: "CGA", url: "https://www.axa.ch/servlets/external/docstoredocument?accesscode=anerb", verifiedOn: "2026-10-20" },
  { insurer: "axa", product: "motor-optima-flex", language: "de", editionFrom: "2025-10-01", documentKind: "AVB", url: "https://www.axa.ch/servlets/external/docstoredocument?accesscode=aneoy", verifiedOn: "2026-10-20" },
  { insurer: "axa", product: "motor-optima-flex", language: "fr", editionFrom: "2025-10-01", documentKind: "CGA", url: "https://www.axa.ch/servlets/external/docstoredocument?accesscode=aneq7", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "it", editionFrom: "2026-01-01", documentKind: "CGA", url: "https://www.css.ch/content/dam/css/it/documents/privatkunden/richtig-versichert/avb/406_i_avb_myflex_ausgabe-01.2026.pdf", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "de", editionFrom: "2026-01-01", documentKind: "AVB", url: "https://www.css.ch/content/dam/css/de/documents/privatkunden/richtig-versichert/avb/406_d_avb_myflex_ausgabe-01.2026.pdf", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "fr", editionFrom: "2026-01-01", documentKind: "CGA", url: "https://www.css.ch/content/dam/css/fr/documents/privatkunden/richtig-versichert/avb/406_f_avb_myflex_ausgabe-01.2026.pdf", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "it", editionFrom: "2027-01-01", documentKind: "CGA", url: "https://www.css.ch/content/dam/css/it/documents/privatkunden/richtig-versichert/avb/406_i_avb_myflex_ausgabe-01.2027.pdf", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "de", editionFrom: "2027-01-01", documentKind: "AVB", url: "https://www.css.ch/content/dam/css/de/documents/privatkunden/richtig-versichert/avb/406_d_avb_myflex_ausgabe-01.2027.pdf", verifiedOn: "2026-10-20" },
  { insurer: "css", product: "myflex-cga", language: "fr", editionFrom: "2027-01-01", documentKind: "CGA", url: "https://www.css.ch/content/dam/css/fr/documents/privatkunden/richtig-versichert/avb/406_f_avb_myflex_ausgabe-01.2027.pdf", verifiedOn: "2026-10-20" },
];

/** Matches candidate publications only; never labels one as governing a contract. */
export function findSwissCgaSourceCandidates(input: {
  insurer: string;
  product?: string;
  language?: SwissCgaLanguage;
  contractEffectiveOn?: string;
}): SwissCgaSource[] {
  const insurer = input.insurer.trim().toLowerCase();
  const matches = swissCgaPdfSources.filter((source) =>
    source.insurer === insurer &&
    (!input.product || source.product === input.product) &&
    (!input.language || source.language === input.language)
  );
  // A version published for a future date should not be supplied as an
  // apparently applicable contract edition. Unknown-edition sources remain
  // candidates requiring explicit edition verification.
  return matches.filter((source) =>
    !input.contractEffectiveOn ||
    !source.editionFrom ||
    source.editionFrom <= input.contractEffectiveOn
  ).sort((a, b) => (b.editionFrom ?? "").localeCompare(a.editionFrom ?? ""));
}
