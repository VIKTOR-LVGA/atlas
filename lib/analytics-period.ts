export type AnalyticsPeriod =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "ytd"
  | "12m"
  | "3m"
  | "6m"
  | "all";

const ZURICH = "Europe/Zurich";

export function periodBounds(period: AnalyticsPeriod, now = new Date()): {
  from: Date | null;
  to: Date;
  label: string;
} {
  const to = now;
  // Prefer calendar math in Zurich via ISO date parts
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZURICH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const zurichNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const subtractDays = (days: number) => {
    const date = new Date(zurichNoon);
    date.setUTCDate(date.getUTCDate() - days);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  };

  switch (period) {
    case "today":
      return { from: subtractDays(0), to, label: "Oggi" };
    case "7d":
      return { from: subtractDays(7), to, label: "7 giorni" };
    case "30d":
      return { from: subtractDays(30), to, label: "30 giorni" };
    case "90d":
      return { from: subtractDays(90), to, label: "90 giorni" };
    case "3m":
      return { from: subtractDays(90), to, label: "3 mesi" };
    case "6m":
      return { from: subtractDays(182), to, label: "6 mesi" };
    case "12m":
      return { from: subtractDays(365), to, label: "12 mesi" };
    case "ytd":
      return {
        from: new Date(Date.UTC(y, 0, 1, 0, 0, 0)),
        to,
        label: "Anno in corso",
      };
    case "all":
    default:
      return { from: null, to, label: "Tutto" };
  }
}

export function pct(part: number, whole: number) {
  if (!whole || !Number.isFinite(part) || !Number.isFinite(whole)) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function dropOff(from: number, to: number) {
  if (!from) return 0;
  return Math.round(((from - to) / from) * 1000) / 10;
}

export function safeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatChfMoney(value: number | string | null | undefined) {
  const n = safeNumber(value);
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
