/** Client-safe claim helpers (no server-only). */

export type ClaimCategory =
  | "car_accident"
  | "home_damage"
  | "theft"
  | "travel"
  | "baggage"
  | "liability"
  | "health_injury"
  | "legal"
  | "other";

const CATEGORY_LABELS: Record<ClaimCategory, string> = {
  car_accident: "Incidente auto",
  home_damage: "Danno casa",
  theft: "Furto",
  travel: "Viaggio",
  baggage: "Bagaglio",
  liability: "Responsabilità civile",
  health_injury: "Salute / infortunio",
  legal: "Protezione giuridica",
  other: "Altro",
};

export function claimCategoryLabel(category: ClaimCategory) {
  return CATEGORY_LABELS[category];
}
