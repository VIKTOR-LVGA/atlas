import type { TypedPolicyType } from "@/lib/types";

export const swissPolicySubtypes = [
  "lamal_base",
  "lca_complementary",
  "hospital",
  "household",
  "liability",
  "car",
  "casco_partial",
  "casco_full",
  "legal_protection",
  "travel",
  "accident",
  "life",
  "dental",
  "income_protection",
  "business",
  "other",
] as const;

export type SwissPolicySubtype = (typeof swissPolicySubtypes)[number];

type ProviderDefinition = {
  canonical: string;
  aliases: string[];
};

type PolicySubtypeDefinition = {
  subtype: SwissPolicySubtype;
  policyType: TypedPolicyType;
  label: string;
  keywords: string[];
};

const swissProviders: ProviderDefinition[] = [
  {
    canonical: "Helsana",
    aliases: ["helsana", "helsana versicherungen", "helsana assicurazioni"],
  },
  {
    canonical: "CSS",
    aliases: ["css", "css assurance", "css assicurazione", "css versicherung"],
  },
  { canonical: "Sanitas", aliases: ["sanitas"] },
  { canonical: "Swica", aliases: ["swica"] },
  {
    canonical: "Groupe Mutuel",
    aliases: ["groupe mutuel", "mutuel assurance", "mutuel assicurazione"],
  },
  { canonical: "Assura", aliases: ["assura"] },
  { canonical: "Atupri", aliases: ["atupri"] },
  { canonical: "Concordia", aliases: ["concordia"] },
  { canonical: "Visana", aliases: ["visana"] },
  { canonical: "AXA", aliases: ["axa", "axa winterthur"] },
  {
    canonical: "Zurich",
    aliases: ["zurich", "zurigo", "zurich insurance"],
  },
  {
    canonical: "Mobiliar",
    aliases: [
      "mobiliar",
      "mobiliare",
      "mobiliere",
      "schweizerische mobiliar",
      "la mobiliare",
    ],
  },
  { canonical: "Allianz", aliases: ["allianz"] },
  { canonical: "Generali", aliases: ["generali"] },
  { canonical: "Baloise", aliases: ["baloise", "basler"] },
  { canonical: "Smile", aliases: ["smile", "smile direct"] },
  { canonical: "Elvia", aliases: ["elvia"] },
  { canonical: "TCS", aliases: ["tcs", "touring club suisse", "touring club svizzero"] },
  { canonical: "Vaudoise", aliases: ["vaudoise"] },
  { canonical: "Helvetia", aliases: ["helvetia"] },
  { canonical: "Pax", aliases: ["pax"] },
  { canonical: "Swiss Life", aliases: ["swiss life", "swisslife"] },
];

const policySubtypeDefinitions: PolicySubtypeDefinition[] = [
  {
    subtype: "lamal_base",
    policyType: "health",
    label: "LAMal base",
    keywords: [
      "lamal",
      "lalmal",
      "base obbligatoria",
      "assicurazione obbligatoria delle cure",
      "assicurazione di base",
      "grundversicherung",
      "okp",
      "obligatorische krankenpflegeversicherung",
      "assurance obligatoire des soins",
      "aos",
      "kvg",
    ],
  },
  {
    subtype: "lca_complementary",
    policyType: "health",
    label: "LCA complementare",
    keywords: [
      "lca",
      "vvg",
      "complementare",
      "complementary",
      "assicurazione complementare",
      "zusatzversicherung",
      "assurance complementaire",
    ],
  },
  {
    subtype: "hospital",
    policyType: "health",
    label: "Copertura ospedaliera",
    keywords: [
      "ospedaliera",
      "ospedale",
      "hospital",
      "spital",
      "semi-privata",
      "semiprivata",
      "privata",
      "halbprivat",
      "allgemeine abteilung",
    ],
  },
  {
    subtype: "household",
    policyType: "household",
    label: "Economia domestica",
    keywords: ["economia domestica", "mobilia domestica", "household", "hausrat", "menage"],
  },
  {
    subtype: "liability",
    policyType: "liability",
    label: "RC privata",
    keywords: [
      "rc privata",
      "responsabilita civile",
      "responsabilite civile",
      "privathaftpflicht",
      "liability",
    ],
  },
  {
    subtype: "car",
    policyType: "car",
    label: "Auto",
    keywords: ["auto", "veicolo", "vehicle", "fahrzeug", "automobile"],
  },
  {
    subtype: "casco_partial",
    policyType: "car",
    label: "Casco parziale",
    keywords: ["casco parziale", "teilkasko", "partial casco"],
  },
  {
    subtype: "casco_full",
    policyType: "car",
    label: "Casco totale",
    keywords: ["casco totale", "vollkasko", "full casco"],
  },
  {
    subtype: "legal_protection",
    policyType: "legal",
    label: "Protezione giuridica",
    keywords: ["protezione giuridica", "rechtsschutz", "protection juridique", "legal protection"],
  },
  {
    subtype: "travel",
    policyType: "other",
    label: "Viaggio",
    keywords: ["viaggio", "travel", "reise", "voyage", "annullamento"],
  },
  {
    subtype: "accident",
    policyType: "health",
    label: "Infortunio",
    keywords: ["infortunio", "accident", "unfall", "accident couvert"],
  },
  {
    subtype: "life",
    policyType: "other",
    label: "Vita",
    keywords: ["vita", "life", "leben", "deces", "decesso"],
  },
  {
    subtype: "dental",
    policyType: "health",
    label: "Dentale",
    keywords: ["dentale", "denti", "dental", "zahnarzt", "soins dentaires"],
  },
  {
    subtype: "income_protection",
    policyType: "other",
    label: "Perdita di guadagno",
    keywords: [
      "perdita di guadagno",
      "indennita giornaliera",
      "income protection",
      "taggeld",
      "krankentaggeld",
    ],
  },
  {
    subtype: "business",
    policyType: "other",
    label: "Assicurazione aziendale",
    keywords: ["azienda", "business", "enterprise", "betriebs", "entreprise"],
  },
];

export const swissPolicySubtypeLabels: Record<SwissPolicySubtype, string> = {
  lamal_base: "LAMal base",
  lca_complementary: "LCA complementare",
  hospital: "Copertura ospedaliera",
  household: "Economia domestica",
  liability: "RC privata",
  car: "Auto",
  casco_partial: "Casco parziale",
  casco_full: "Casco totale",
  legal_protection: "Protezione giuridica",
  travel: "Viaggio",
  accident: "Infortunio",
  life: "Vita",
  dental: "Dentale",
  income_protection: "Perdita di guadagno",
  business: "Assicurazione aziendale",
  other: "Altro",
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function isSwissPolicySubtype(
  value: string | null | undefined
): value is SwissPolicySubtype {
  return swissPolicySubtypes.includes(value as SwissPolicySubtype);
}

export function normalizeSwissInsuranceProvider(
  rawProvider: string | null | undefined,
  context = ""
) {
  const source = normalizeSearchText(`${rawProvider ?? ""} ${context}`);

  if (!source) {
    return {
      provider: rawProvider?.trim() || null,
      matchedAlias: null,
      confidence: null,
    };
  }

  for (const provider of swissProviders) {
    const matchedAlias = provider.aliases.find((alias) =>
      source.includes(normalizeSearchText(alias))
    );

    if (matchedAlias) {
      return {
        provider: provider.canonical,
        matchedAlias,
        confidence: normalizeSearchText(matchedAlias) === normalizeSearchText(rawProvider ?? "")
          ? 98
          : 92,
      };
    }
  }

  return {
    provider: rawProvider?.trim() || null,
    matchedAlias: null,
    confidence: rawProvider?.trim() ? 68 : null,
  };
}

export function normalizeSwissPolicyClassification(
  value: string | null | undefined,
  context = ""
) {
  const normalizedValue = normalizeSearchText(value ?? "");
  const source = normalizeSearchText(`${value ?? ""} ${context}`);
  const directSubtype = isSwissPolicySubtype(normalizedValue)
    ? normalizedValue
    : null;
  const matchedDefinition =
    (directSubtype &&
      policySubtypeDefinitions.find(
        (definition) => definition.subtype === directSubtype
      )) ||
    policySubtypeDefinitions.find((definition) =>
      definition.keywords.some((keyword) =>
        source.includes(normalizeSearchText(keyword))
      )
    );

  if (matchedDefinition) {
    return {
      policyType: matchedDefinition.policyType,
      subtype: matchedDefinition.subtype,
      categoryLabel: matchedDefinition.label,
      matchedKeywords: matchedDefinition.keywords.filter((keyword) =>
        source.includes(normalizeSearchText(keyword))
      ),
    };
  }

  return {
    policyType: "other" as TypedPolicyType,
    subtype: "other" as SwissPolicySubtype,
    categoryLabel: value?.trim() || null,
    matchedKeywords: [],
  };
}

export function getSwissInsuranceKeywords(text: string, limit = 24) {
  const source = normalizeSearchText(text);
  const providerKeywords = swissProviders.flatMap((provider) => provider.aliases);
  const subtypeKeywords = policySubtypeDefinitions.flatMap(
    (definition) => definition.keywords
  );

  return uniqueStrings([...providerKeywords, ...subtypeKeywords])
    .filter((keyword) => source.includes(normalizeSearchText(keyword)))
    .slice(0, limit);
}
