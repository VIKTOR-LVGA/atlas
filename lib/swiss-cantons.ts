/** Swiss cantons — codes, labels, privacy threshold. Geometry: /public/geo. */

export const SWISS_CANTON_CODES = [
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE",
  "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH",
] as const;

export type SwissCantonCode = (typeof SWISS_CANTON_CODES)[number];

export const CANTON_LABELS: Record<SwissCantonCode | "UNKNOWN", string> = {
  AG: "Argovia",
  AI: "Appenzello Interno",
  AR: "Appenzello Esterno",
  BE: "Berna",
  BL: "Basilea Campagna",
  BS: "Basilea Città",
  FR: "Friburgo",
  GE: "Ginevra",
  GL: "Glarona",
  GR: "Grigioni",
  JU: "Giura",
  LU: "Lucerna",
  NE: "Neuchâtel",
  NW: "Nidwaldo",
  OW: "Obwaldo",
  SG: "San Gallo",
  SH: "Sciaffusa",
  SO: "Soletta",
  SZ: "Svitto",
  TG: "Turgovia",
  TI: "Ticino",
  UR: "Uri",
  VD: "Vaud",
  VS: "Vallese",
  ZG: "Zug",
  ZH: "Zurigo",
  UNKNOWN: "Non disponibile",
};

/** Minimum distinct clients before partner-facing canton metrics are shown in full. */
export const PARTNER_GEO_PRIVACY_THRESHOLD = 3;

export function isSwissCantonCode(value: string): value is SwissCantonCode {
  return (SWISS_CANTON_CODES as readonly string[]).includes(value);
}

export function cantonLabel(code: string | null | undefined) {
  if (!code) return CANTON_LABELS.UNKNOWN;
  const upper = code.toUpperCase();
  if (isSwissCantonCode(upper)) return CANTON_LABELS[upper];
  if (upper === "UNKNOWN") return CANTON_LABELS.UNKNOWN;
  return CANTON_LABELS.UNKNOWN;
}
