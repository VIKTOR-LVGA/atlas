/** Swiss cantons — codes, labels, and simplified SVG paths for choropleth maps. */

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

/**
 * Approximate canton polygons on a 640×400 viewBox (schematic, not cadastral).
 * Enough for interactive choropleth; not for navigation.
 */
export const CANTON_PATHS: Record<SwissCantonCode, string> = {
  ZH: "M390 70 L430 65 L455 85 L450 120 L415 130 L385 115 L375 90 Z",
  SH: "M400 40 L430 38 L440 55 L420 62 L395 55 Z",
  TG: "M455 70 L500 75 L505 105 L470 115 L450 95 Z",
  SG: "M450 115 L505 110 L530 145 L510 175 L465 165 L445 140 Z",
  AR: "M505 120 L525 118 L530 135 L515 140 Z",
  AI: "M520 135 L535 132 L538 148 L525 150 Z",
  GL: "M470 165 L495 170 L490 195 L465 190 Z",
  GR: "M490 180 L560 175 L575 230 L540 270 L480 250 L470 210 Z",
  UR: "M400 175 L430 180 L425 215 L395 210 Z",
  SZ: "M375 145 L415 140 L420 170 L385 175 Z",
  ZG: "M365 125 L390 122 L395 140 L370 145 Z",
  LU: "M320 120 L365 115 L375 155 L340 170 L305 150 Z",
  OW: "M340 170 L365 165 L370 190 L345 195 Z",
  NW: "M365 165 L390 160 L395 185 L370 188 Z",
  BE: "M220 100 L320 95 L340 160 L300 210 L230 200 L200 150 Z",
  SO: "M280 85 L330 80 L340 110 L300 120 L275 105 Z",
  BL: "M290 55 L330 50 L340 75 L305 80 Z",
  BS: "M305 40 L325 38 L330 52 L310 55 Z",
  AG: "M330 70 L385 65 L390 105 L350 115 L325 95 Z",
  JU: "M200 55 L250 50 L260 85 L220 95 L195 75 Z",
  NE: "M180 110 L230 105 L240 140 L195 150 L170 130 Z",
  FR: "M230 155 L285 150 L295 195 L250 210 L220 185 Z",
  VD: "M150 160 L230 155 L245 220 L180 250 L130 210 Z",
  GE: "M115 230 L145 225 L150 250 L125 255 Z",
  VS: "M250 220 L400 210 L430 260 L350 300 L240 280 Z",
  TI: "M430 260 L480 255 L495 310 L450 340 L415 300 Z",
};

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
