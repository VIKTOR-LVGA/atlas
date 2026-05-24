/** Shared motion tokens (CSS classes reference these durations in globals.css). */
export const MOTION_DURATION_MS = {
  fast: 150,
  normal: 220,
  slow: 420,
  bar: 700,
} as const;

export function parseDisplayNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "N/D" || trimmed.startsWith("Non ")) {
    return null;
  }

  const match = trimmed.match(/-?\d[\d'.,]*/);
  if (!match) {
    return null;
  }

  const normalized = match[0].replace(/'/g, "").replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatKpiValue(
  value: number | null | undefined,
  formatter: (amount: number) => string
): { display: string; unavailable: boolean } {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { display: "Non disponibile", unavailable: true };
  }

  return { display: formatter(value), unavailable: false };
}

export function formatAnimatedNumber(value: string, current: number): string {
  const parsed = parseDisplayNumber(value);
  if (parsed === null) {
    return value;
  }

  if (value.includes("'")) {
    return new Intl.NumberFormat("de-CH").format(Math.round(current));
  }

  if (value.includes("%")) {
    return `${Math.round(current)}%`;
  }

  if (value.startsWith("CHF") || value.includes("CHF")) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      maximumFractionDigits: 0,
    }).format(Math.round(current));
  }

  return String(Math.round(current));
}
