import type { PolicyCoverageDetail, PolicyDetails } from "@/lib/types";
import type { PolicyDocumentExtractionResult } from "@/lib/document-analysis";
import { normalizeCoverageLabel } from "@/lib/insurance-knowledge";

function parseSwissAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/\u00a0/g, " ")
    .replace(/CHF/gi, "")
    .replace(/\s+/g, "")
    .replace(/'/g, "")
    .replace(/’/g, "")
    .replace(/,/g, ".");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function firstMatch(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

export type MotorRecovery = {
  vehicleMake: string | null;
  vehicleModel: string | null;
  licensePlate: string | null;
  annualGrossPremium: number | null;
  paymentFrequencyLabel: string | null;
  coverages: PolicyCoverageDetail[];
};

/**
 * Deterministic Swiss motor second-pass recovery from PDF text.
 * Never invents values — only fills gaps from explicit labels.
 */
export function recoverSwissMotorPolicyFields(text: string): MotorRecovery {
  const sample = text.slice(0, 100_000);

  const annualGrossPremium = (() => {
    const match = firstMatch(sample, [
      /totale\s+premio\s+annuo[^\d]{0,80}([\d'"’.\s]+)/i,
      /total\s+jahrespr[aä]mie[^\d]{0,80}([\d'"’.\s]+)/i,
      /prime\s+annuelle\s+totale[^\d]{0,80}([\d'"’.\s]+)/i,
    ]);
    return match ? parseSwissAmount(match[1]) : null;
  })();

  const paymentFrequencyLabel = (() => {
    const match = firstMatch(sample, [
      /modalit[aà]\s+di\s+pagamento[:\s]+([A-Za-zàèéìòù]+)/i,
      /zahlungsweise[:\s]+([A-Za-zäöü]+)/i,
      /mode\s+de\s+paiement[:\s]+([A-Za-zàèéù]+)/i,
    ]);
    return match?.[1]?.trim() ?? null;
  })();

  const licensePlate = (() => {
    const match = firstMatch(sample, [
      /numero\s+di\s+targa[:\s]+([A-Z]{1,2}\s*\d{4,6})/i,
      /kontrollschild[:\s]+([A-Z]{1,2}\s*\d{4,6})/i,
      /plaque[:\s]+([A-Z]{1,2}\s*\d{4,6})/i,
      /\b([A-Z]{2}\s*\d{5,6})\b/,
    ]);
    return match?.[1]?.replace(/\s+/g, " ").trim().toUpperCase() ?? null;
  })();

  const vehicleBlock = (() => {
    const match = firstMatch(sample, [
      /veicolo\/?veicoli[:\s]+([^\n]+)/i,
      /marca\s+di\s+fabbrica[:\s]+([A-Z0-9\-\s]+)/i,
      /fahrzeug[:\s]+([^\n]+)/i,
      /v[ée]hicule[:\s]+([^\n]+)/i,
    ]);
    return match?.[1]?.trim() ?? null;
  })();

  let vehicleMake: string | null = null;
  let vehicleModel: string | null = null;
  if (vehicleBlock) {
    const mercedes = vehicleBlock.match(
      /(MERCEDES[-\s]?BENZ)\s+(.+)/i
    );
    const generic = vehicleBlock.match(
      /^([A-Z][A-Z0-9\-]+)\s+(.+)$/
    );
    if (mercedes) {
      vehicleMake = "MERCEDES-BENZ";
      vehicleModel = mercedes[2].trim();
    } else if (generic) {
      vehicleMake = generic[1].trim().toUpperCase();
      vehicleModel = generic[2].trim();
    } else {
      vehicleModel = vehicleBlock;
    }
  }

  const coverages: PolicyCoverageDetail[] = [];
  const seen = new Set<string>();

  const rowPatterns: Array<{ pattern: RegExp; fallbackLabel: string }> = [
    { pattern: /(Responsabilit[aà]\s+civile[^\n]{0,80}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Responsabilità civile" },
    { pattern: /(Collisione[^\n]{0,80}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Collisione" },
    { pattern: /(Casco\s+parziale[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Casco parziale" },
    { pattern: /(Furto[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Furto" },
    { pattern: /(Forze\s+della\s+natura[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Forze della natura" },
    { pattern: /(Incendio[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Incendio" },
    { pattern: /(Danni\s+di\s+animali[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Danni di animali" },
    { pattern: /(Rottura\s+vetri[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Rottura vetri" },
    { pattern: /(Vandalismo[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Vandalismo" },
    { pattern: /(Martore[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Martore" },
    { pattern: /(Danni\s+di\s+parcheggio[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Danni di parcheggio" },
    { pattern: /(Infortunio\s*\(?\s*passeggeri\s*\)?[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Infortunio passeggeri" },
    { pattern: /(Soccorso\s+stradale[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Soccorso stradale" },
    { pattern: /(Protezione\s+giuridica[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Protezione giuridica" },
    { pattern: /(Cyber[^\n]{0,40}?)(?:\s+)(S[iì]|No)\b/i, fallbackLabel: "Cyber" },
  ];

  for (const { pattern, fallbackLabel } of rowPatterns) {
    const match = sample.match(pattern);
    if (!match) continue;
    const original = (match[1] || fallbackLabel).replace(/\s+/g, " ").trim();
    const included = /^s/i.test(match[2] || "");
    const normalized = normalizeCoverageLabel(original);
    const key = normalized.canonicalType ?? original.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    coverages.push({
      name: original,
      original_label: original,
      canonical_type: normalized.canonicalType,
      coverage_status: included ? "included" : "excluded",
      premium_amount: null,
      deductible: null,
      coverage_amount: null,
      notes: "Recovered from motor coverage table",
    });
  }

  // Premium rows for main modules when premiums are listed without Sí/No on same line
  const premiumRows: Array<{ pattern: RegExp; label: string; canonical: string }> = [
    { pattern: /Responsabilit[aà]\s+civile[^\d]{0,60}([\d'"’.\s]+)/i, label: "Responsabilità civile", canonical: "motor_liability" },
    { pattern: /Collisione[^\d]{0,60}([\d'"’.\s]+)/i, label: "Collisione (Casco totale)", canonical: "collision_damage" },
    { pattern: /Casco\s+parziale[^\d]{0,40}([\d'"’.\s]+)/i, label: "Casco parziale", canonical: "partial_casco" },
  ];
  for (const row of premiumRows) {
    const match = sample.match(row.pattern);
    if (!match) continue;
    const premium = parseSwissAmount(match[1]);
    if (premium === null || premium <= 0 || premium > 20000) continue;
    const existing = coverages.find(
      (c) => c.canonical_type === row.canonical || c.name === row.label
    );
    if (existing) {
      existing.premium_amount = existing.premium_amount ?? premium;
      existing.coverage_status = existing.coverage_status ?? "included";
      continue;
    }
    coverages.push({
      name: row.label,
      original_label: row.label,
      canonical_type: row.canonical,
      coverage_status: "included",
      premium_amount: premium,
      deductible: null,
      coverage_amount: null,
      notes: "Recovered from motor premium panorama",
    });
  }

  return {
    vehicleMake,
    vehicleModel,
    licensePlate,
    annualGrossPremium,
    paymentFrequencyLabel,
    coverages,
  };
}

export function applySwissMotorRecovery(
  result: PolicyDocumentExtractionResult,
  extractedText: string
): PolicyDocumentExtractionResult {
  const isMotor =
    result.draft.policyType === "car" ||
    /auto|vehicle|motor|veicol|fahrzeug/i.test(
      `${result.draft.policyType} ${result.draft.policyCategoryLabel ?? ""}`
    ) ||
    /la\s+mia\s+assicurazione\s+auto|motorfahrzeug|veicolo\/veicoli/i.test(
      extractedText.slice(0, 8000)
    );

  if (!isMotor) return result;

  const recovered = recoverSwissMotorPolicyFields(extractedText);
  const details = { ...(result.draft.details ?? {}) } as PolicyDetails;
  const existingCoverages = Array.isArray(details.coverages)
    ? details.coverages
    : [];

  if (!details.vehicle_make && recovered.vehicleMake) {
    details.vehicle_make = recovered.vehicleMake;
  }
  if (!details.vehicle_model && !details.vehicle && recovered.vehicleModel) {
    details.vehicle_model = recovered.vehicleModel;
    details.vehicle = [recovered.vehicleMake, recovered.vehicleModel]
      .filter(Boolean)
      .join(" ");
  }
  if (!details.license_plate && !details.plate_number && recovered.licensePlate) {
    details.license_plate = recovered.licensePlate;
    details.plate_number = recovered.licensePlate;
  } else if (details.license_plate && !details.plate_number) {
    details.plate_number = details.license_plate;
  } else if (details.plate_number && !details.license_plate) {
    details.license_plate = details.plate_number;
  }
  if (recovered.paymentFrequencyLabel) {
    details.payment_frequency_label = recovered.paymentFrequencyLabel;
  }
  if (recovered.annualGrossPremium != null) {
    details.annual_gross_premium = recovered.annualGrossPremium;
  }

  if (existingCoverages.length === 0 && recovered.coverages.length > 0) {
    details.coverages = recovered.coverages;
  } else if (existingCoverages.length > 0 && recovered.coverages.length > 0) {
    // Fill missing excluded/included statuses
    const byCanonical = new Map(
      existingCoverages.map((c) => [c.canonical_type ?? c.name, c])
    );
    for (const item of recovered.coverages) {
      const key = item.canonical_type ?? item.name;
      if (!byCanonical.has(key)) {
        existingCoverages.push(item);
      }
    }
    details.coverages = existingCoverages;
  }

  // If annual total is known and premium looks like the annual figure but frequency is installment,
  // keep amount as annual and coerce frequency to annual (payment cadence stays in details).
  let premiumAmount = result.draft.premiumAmount;
  let premiumFrequency = result.draft.premiumFrequency;
  if (recovered.annualGrossPremium != null) {
    const annual = recovered.annualGrossPremium;
    if (
      premiumAmount != null &&
      premiumFrequency &&
      premiumFrequency !== "annual" &&
      Math.abs(premiumAmount - annual) < 5
    ) {
      premiumFrequency = "annual";
      premiumAmount = annual;
    } else if (premiumAmount == null) {
      premiumAmount = annual;
      premiumFrequency = premiumFrequency ?? "annual";
    } else if (
      premiumFrequency === "semiannual" &&
      Math.abs(premiumAmount * 2 - annual) > 50 &&
      Math.abs(premiumAmount - annual) < 30
    ) {
      // Model put annual total into installment slot.
      premiumFrequency = "annual";
      premiumAmount = annual;
    }
  }

  return {
    ...result,
    draft: {
      ...result.draft,
      premiumAmount,
      premiumFrequency,
      policyType: result.draft.policyType === "other" ? "car" : result.draft.policyType,
      policyCategoryLabel: result.draft.policyCategoryLabel ?? "Auto",
      details,
    },
  };
}
