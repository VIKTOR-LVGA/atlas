/** Policy Experience 3.0 — tab ids preserved in URL `?view=` */
export const policyExperienceTabs = [
  "overview",
  "coverages",
  "opportunities",
  "document",
  "review",
] as const;

export type PolicyExperienceTab = (typeof policyExperienceTabs)[number];

export const policyExperienceTabLabels: Record<PolicyExperienceTab, string> = {
  overview: "Panoramica",
  coverages: "Coperture",
  opportunities: "Opportunità",
  document: "Documento",
  review: "Verifica dati",
};

export function parsePolicyExperienceTab(value: string | undefined | null): PolicyExperienceTab {
  if (value && policyExperienceTabs.includes(value as PolicyExperienceTab)) {
    return value as PolicyExperienceTab;
  }
  return "overview";
}

/** Deduplicated motor display fields — one source of truth for UI. */
export type MotorVehicleDisplay = {
  make: string | null;
  model: string | null;
  title: string | null;
  plate: string | null;
  firstRegistration: string | null;
  fuel: string | null;
  power: string | null;
  engineCc: string | null;
  usage: string | null;
  catalogPrice: number | null;
  leasingCompany: string | null;
};

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,\-]/g, "").replace(/'/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function getMotorVehicleDisplay(
  details: Record<string, unknown> | null | undefined
): MotorVehicleDisplay {
  const d = details ?? {};
  const make = asText(d.vehicle_make);
  const model = asText(d.vehicle_model) ?? asText(d.vehicle);
  const plate =
    asText(d.license_plate) ?? asText(d.plate_number) ?? asText(d.plate);
  const title = [make, model].filter(Boolean).join(" ") || asText(d.vehicle);

  return {
    make,
    model,
    title: title || null,
    plate,
    firstRegistration: asText(d.first_registration) ?? asText(d.prima_immatricolazione),
    fuel: asText(d.fuel_type) ?? asText(d.tipo_carburante),
    power: asText(d.power) ?? asText(d.cv_din) ?? asText(d.power_kw),
    engineCc: asText(d.engine_cc) ?? asText(d.cilindrata),
    usage: asText(d.usage) ?? asText(d.uso_del_veicolo),
    catalogPrice: asNumber(d.catalog_price) ?? asNumber(d.prezzo_catalogo),
    leasingCompany: asText(d.leasing_company) ?? asText(d.societa_di_leasing),
  };
}

/** Car detail keys that should NOT repeat in generic overview when motor UI shows them. */
export const MOTOR_OVERVIEW_SUPPRESSED_DETAIL_KEYS = new Set([
  "plate_number",
  "license_plate",
  "vehicle_make",
  "vehicle_model",
  "vehicle",
  "annual_gross_premium",
  "casco",
]);
