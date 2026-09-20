const MONEY_SCALE = BigInt(100);
const PERCENT_SCALE = BigInt(10_000);

function parseScaled(value: string | number, scale: bigint) {
  const normalized = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new Error(`Invalid decimal: ${value}`);
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const digits = scale.toString().length - 1;
  const padded = (fraction + "0".repeat(digits + 1)).slice(0, digits + 1);
  let result = BigInt(whole) * scale + BigInt(padded.slice(0, digits) || "0");
  if (Number(padded[digits] ?? "0") >= 5) result += BigInt(1);
  return negative ? -result : result;
}

function divideRoundHalfAway(numerator: bigint, denominator: bigint) {
  const negative = numerator < BigInt(0);
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute + denominator / BigInt(2)) / denominator;
  return negative ? -rounded : rounded;
}

export function moneyToCents(value: string | number) {
  return parseScaled(value, MONEY_SCALE);
}

export function centsToMoney(value: bigint) {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  return `${negative ? "-" : ""}${absolute / MONEY_SCALE}.${String(absolute % MONEY_SCALE).padStart(2, "0")}`;
}

export function splitCommission(gross: string | number, atlasPercentage: string | number) {
  const grossCents = moneyToCents(gross);
  if (grossCents < BigInt(0)) throw new Error("Gross commission must be non-negative");
  const percentage = parseScaled(atlasPercentage, PERCENT_SCALE);
  if (percentage < BigInt(0) || percentage > BigInt(100) * PERCENT_SCALE) throw new Error("Percentage out of range");
  const atlasCents = divideRoundHalfAway(grossCents * percentage, BigInt(100) * PERCENT_SCALE);
  const brokerCents = grossCents - atlasCents;
  return { gross: centsToMoney(grossCents), atlas: centsToMoney(atlasCents), broker: centsToMoney(brokerCents) };
}

export function splitAdjustment(amount: string | number, original: { gross: string | number; atlas: string | number; other?: string | number }) {
  const amountCents = moneyToCents(amount);
  const grossCents = moneyToCents(original.gross);
  if (grossCents === BigInt(0)) throw new Error("Zero commission cannot be adjusted");
  const atlasCents = divideRoundHalfAway(amountCents * moneyToCents(original.atlas), grossCents);
  const otherCents = divideRoundHalfAway(amountCents * moneyToCents(original.other ?? 0), grossCents);
  const brokerCents = amountCents - atlasCents - otherCents;
  return { amount: centsToMoney(amountCents), atlas: centsToMoney(atlasCents), broker: centsToMoney(brokerCents), other: centsToMoney(otherCents) };
}
