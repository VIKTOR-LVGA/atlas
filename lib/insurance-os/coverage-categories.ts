/**
 * Coverage Map categories — Swiss retail portfolio view.
 * NO_POLICY_FOUND ≠ "you are uncovered".
 */

export type CoverageMapCategoryId =
  | "home_building"
  | "household"
  | "liability"
  | "mobility"
  | "health"
  | "travel"
  | "legal"
  | "life"
  | "accident"
  | "pension"
  | "other";

export type CoverageMapStatus =
  | "covered"
  | "partially_known"
  | "needs_verification"
  | "no_policy_found"
  | "not_applicable";

export type CoverageMapCategoryDef = {
  id: CoverageMapCategoryId;
  label: string;
  description: string;
  /** Maps policy_type / insurance_category */
  policyTypes: string[];
  insuranceCategories: string[];
};

export const COVERAGE_MAP_CATEGORIES: CoverageMapCategoryDef[] = [
  {
    id: "home_building",
    label: "Casa",
    description: "Stabile / edificio",
    policyTypes: ["building"],
    insuranceCategories: ["building"],
  },
  {
    id: "household",
    label: "Mobilia",
    description: "Economia domestica",
    policyTypes: ["household"],
    insuranceCategories: ["household"],
  },
  {
    id: "liability",
    label: "Responsabilità civile",
    description: "RC privata",
    policyTypes: ["liability"],
    insuranceCategories: ["private_liability"],
  },
  {
    id: "mobility",
    label: "Auto / Mobilità",
    description: "Veicoli e mobilità",
    policyTypes: ["car"],
    insuranceCategories: ["vehicle"],
  },
  {
    id: "health",
    label: "Salute",
    description: "Malattia e complementari",
    policyTypes: ["health"],
    insuranceCategories: ["health_basic", "health_supplementary"],
  },
  {
    id: "travel",
    label: "Viaggi",
    description: "Viaggio e assistenza",
    policyTypes: ["travel"],
    insuranceCategories: ["travel"],
  },
  {
    id: "legal",
    label: "Protezione giuridica",
    description: "Tutela legale",
    policyTypes: ["legal"],
    insuranceCategories: ["legal_protection"],
  },
  {
    id: "life",
    label: "Vita",
    description: "Assicurazione vita",
    policyTypes: ["life"],
    insuranceCategories: ["life"],
  },
  {
    id: "accident",
    label: "Infortuni",
    description: "Infortuni privati",
    policyTypes: ["other"],
    insuranceCategories: ["accident"],
  },
  {
    id: "pension",
    label: "Previdenza",
    description: "Pilastro 3a / previdenza",
    policyTypes: ["pension"],
    insuranceCategories: ["pension"],
  },
  {
    id: "other",
    label: "Altro",
    description: "Altre polizze",
    policyTypes: ["pet", "other"],
    insuranceCategories: ["pet", "other"],
  },
];

export function statusLabel(status: CoverageMapStatus): string {
  switch (status) {
    case "covered":
      return "Copertura trovata";
    case "partially_known":
      return "Parzialmente nota";
    case "needs_verification":
      return "Da verificare";
    case "no_policy_found":
      return "Nessuna polizza caricata";
    case "not_applicable":
      return "Non applicabile";
  }
}

export function statusExplanation(status: CoverageMapStatus): string {
  switch (status) {
    case "covered":
      return "ATLAS ha trovato documenti che confermano una copertura in quest’area.";
    case "partially_known":
      return "Ci sono indicazioni, ma mancano dettagli importanti.";
    case "needs_verification":
      return "I documenti lasciano dubbi: conviene controllare le condizioni.";
    case "no_policy_found":
      return "ATLAS non trova una polizza caricata che confermi questa copertura. Non significa automaticamente che sei scoperto.";
    case "not_applicable":
      return "Quest’area non sembra rilevante per il tuo profilo attuale.";
  }
}
