/**
 * Deterministic CURRENT policy ↔ OFFER comparison.
 * Never labels a whole offer as "better". Field-level states only.
 */

export type ComparisonState =
  | "same"
  | "better_objectively_on_this_field"
  | "worse_objectively_on_this_field"
  | "added"
  | "removed"
  | "different"
  | "unknown"
  | "not_comparable";

export type ComparableItem = {
  key: string;
  label: string;
  current: string | number | null;
  offer: string | number | null;
  difference: string | null;
  state: ComparisonState;
  kind: "premium" | "coverage" | "deductible" | "condition" | "other";
};

export type OfferComparisonResult = {
  items: ComparableItem[];
  badges: string[];
  summaryLines: string[];
  annualPremiumDelta: number | null;
  currency: string;
};

function annualize(amount: number | null | undefined, frequency: string | null | undefined): number | null {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const f = (frequency ?? "annual").toLowerCase();
  const n = Number(amount);
  if (f === "monthly") return n * 12;
  if (f === "quarterly") return n * 4;
  if (f === "semiannual" || f === "semi_annual") return n * 2;
  if (f === "annual" || f === "yearly") return n;
  return null;
}

function formatChf(n: number, currency = "CHF"): string {
  return `${currency} ${n.toLocaleString("it-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type CoverageLike = {
  code?: string | null;
  label: string;
  deductible?: number | string | null;
  limit?: number | string | null;
  present?: boolean;
};

export type CompareInput = {
  currency?: string;
  currentPremium?: number | null;
  currentFrequency?: string | null;
  offerPremium?: number | null;
  offerFrequency?: string | null;
  currentCoverages?: CoverageLike[];
  offerCoverages?: CoverageLike[];
  currentDeductible?: number | null;
  offerDeductible?: number | null;
  conditions?: Array<{
    key: string;
    label: string;
    current: string | null;
    offer: string | null;
  }>;
};

export function comparePolicyToOffer(input: CompareInput): OfferComparisonResult {
  const currency = input.currency ?? "CHF";
  const items: ComparableItem[] = [];
  const badges: string[] = [];
  const summaryLines: string[] = [];

  const currentAnnual = annualize(input.currentPremium ?? null, input.currentFrequency);
  const offerAnnual = annualize(input.offerPremium ?? null, input.offerFrequency);

  let annualPremiumDelta: number | null = null;

  if (currentAnnual != null && offerAnnual != null) {
    annualPremiumDelta = offerAnnual - currentAnnual;
    let state: ComparisonState = "same";
    if (annualPremiumDelta < -0.009) {
      state = "better_objectively_on_this_field"; // lower premium
      badges.push("Più economica");
    } else if (annualPremiumDelta > 0.009) {
      state = "worse_objectively_on_this_field";
      badges.push("Premio più alto");
    } else {
      badges.push("Premio invariato");
    }
    items.push({
      key: "annual_premium",
      label: "Premio annuale",
      current: formatChf(currentAnnual, currency),
      offer: formatChf(offerAnnual, currency),
      difference:
        annualPremiumDelta === 0
          ? null
          : `${annualPremiumDelta > 0 ? "+" : "−"} ${formatChf(Math.abs(annualPremiumDelta), currency)} / anno`,
      state,
      kind: "premium",
    });
    if (annualPremiumDelta !== 0) {
      summaryLines.push(
        `Questa offerta costa ${formatChf(Math.abs(annualPremiumDelta), currency)} ${
          annualPremiumDelta < 0 ? "in meno" : "in più"
        } all'anno.`
      );
    } else {
      summaryLines.push("Il premio annuale risulta invariato.");
    }
  } else if (offerAnnual == null && currentAnnual == null) {
    items.push({
      key: "annual_premium",
      label: "Premio annuale",
      current: null,
      offer: null,
      difference: null,
      state: "unknown",
      kind: "premium",
    });
    badges.push("Dati incompleti");
    summaryLines.push("Premio non confrontabile automaticamente (dati incompleti).");
  } else if (currentAnnual == null || offerAnnual == null) {
    items.push({
      key: "annual_premium",
      label: "Premio annuale",
      current: currentAnnual != null ? formatChf(currentAnnual, currency) : null,
      offer: offerAnnual != null ? formatChf(offerAnnual, currency) : null,
      difference: null,
      state: "not_comparable",
      kind: "premium",
    });
    badges.push("Dati incompleti");
    summaryLines.push("Non confrontabile automaticamente: frequenza o premio mancante.");
  }

  // Global deductible
  if (input.currentDeductible != null || input.offerDeductible != null) {
    const c = input.currentDeductible;
    const o = input.offerDeductible;
    let state: ComparisonState = "unknown";
    if (c != null && o != null) {
      if (o < c) {
        state = "better_objectively_on_this_field";
        badges.push("Franchigia più bassa");
      } else if (o > c) {
        state = "worse_objectively_on_this_field";
        badges.push("Franchigia più alta");
      } else state = "same";
    } else state = "not_comparable";
    items.push({
      key: "deductible",
      label: "Franchigia",
      current: c != null ? formatChf(c, currency) : null,
      offer: o != null ? formatChf(o, currency) : null,
      difference:
        c != null && o != null && c !== o
          ? `${formatChf(c, currency)} → ${formatChf(o, currency)}`
          : null,
      state,
      kind: "deductible",
    });
  }

  const currentMap = new Map<string, CoverageLike>();
  for (const cov of input.currentCoverages ?? []) {
    const key = (cov.code || cov.label).toLowerCase().trim();
    currentMap.set(key, cov);
  }
  const offerMap = new Map<string, CoverageLike>();
  for (const cov of input.offerCoverages ?? []) {
    const key = (cov.code || cov.label).toLowerCase().trim();
    offerMap.set(key, cov);
  }

  let added = 0;
  let removed = 0;
  let changedDed = 0;

  const allKeys = new Set([...currentMap.keys(), ...offerMap.keys()]);
  for (const key of allKeys) {
    const cur = currentMap.get(key);
    const off = offerMap.get(key);
    if (cur && !off) {
      removed += 1;
      items.push({
        key: `cov_${key}`,
        label: cur.label,
        current: "Presente",
        offer: "Assente",
        difference: "Rimossa",
        state: "removed",
        kind: "coverage",
      });
      continue;
    }
    if (!cur && off) {
      added += 1;
      items.push({
        key: `cov_${key}`,
        label: off.label,
        current: "Assente",
        offer: "Presente",
        difference: "Aggiunta",
        state: "added",
        kind: "coverage",
      });
      continue;
    }
    if (cur && off) {
      const curDed = cur.deductible != null ? Number(cur.deductible) : null;
      const offDed = off.deductible != null ? Number(off.deductible) : null;
      if (curDed != null && offDed != null && curDed !== offDed) {
        changedDed += 1;
        items.push({
          key: `cov_${key}`,
          label: cur.label || off.label,
          current: `Franchigia ${formatChf(curDed, currency)}`,
          offer: `Franchigia ${formatChf(offDed, currency)}`,
          difference: `${formatChf(curDed, currency)} → ${formatChf(offDed, currency)}`,
          state: offDed < curDed ? "better_objectively_on_this_field" : "worse_objectively_on_this_field",
          kind: "coverage",
        });
      } else {
        items.push({
          key: `cov_${key}`,
          label: cur.label || off.label,
          current: "Presente",
          offer: "Presente",
          difference: null,
          state: "same",
          kind: "coverage",
        });
      }
    }
  }

  if (added) badges.push("Copertura aggiunta");
  if (removed) badges.push("Copertura rimossa");
  if (added || removed || changedDed) {
    const parts: string[] = [];
    if (added) parts.push(`${added} copertura${added > 1 ? "e" : ""} aggiunta${added > 1 ? "e" : ""}`);
    if (removed) parts.push(`${removed} copertura${removed > 1 ? "e" : ""} rimossa${removed > 1 ? "e" : ""}`);
    if (changedDed) parts.push(`${changedDed} franchigia modificata`);
    summaryLines.push(`Abbiamo rilevato ${parts.join(" e ")}.`);
  }

  for (const cond of input.conditions ?? []) {
    if (cond.current == null && cond.offer == null) {
      items.push({
        key: cond.key,
        label: cond.label,
        current: null,
        offer: null,
        difference: null,
        state: "unknown",
        kind: "condition",
      });
      continue;
    }
    if (cond.current == null || cond.offer == null) {
      items.push({
        key: cond.key,
        label: cond.label,
        current: cond.current,
        offer: cond.offer,
        difference: null,
        state: "not_comparable",
        kind: "condition",
      });
      continue;
    }
    items.push({
      key: cond.key,
      label: cond.label,
      current: cond.current,
      offer: cond.offer,
      difference: cond.current === cond.offer ? null : `${cond.current} → ${cond.offer}`,
      state: cond.current === cond.offer ? "same" : "different",
      kind: "condition",
    });
  }

  if (!summaryLines.length) {
    summaryLines.push("Confronto disponibile solo sui campi con dati verificati.");
  }

  return {
    items,
    badges: [...new Set(badges)],
    summaryLines,
    annualPremiumDelta,
    currency,
  };
}

export function comparisonStateLabel(state: ComparisonState): string {
  switch (state) {
    case "same":
      return "Uguale";
    case "better_objectively_on_this_field":
      return "Valore più favorevole su questo campo";
    case "worse_objectively_on_this_field":
      return "Valore meno favorevole su questo campo";
    case "added":
      return "Aggiunta";
    case "removed":
      return "Rimossa";
    case "different":
      return "Diverso";
    case "unknown":
      return "Dato mancante";
    case "not_comparable":
      return "Non confrontabile automaticamente";
  }
}
