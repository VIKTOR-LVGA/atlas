/**
 * Verification / grounding vocabulary for Insurance Operating System.
 * Never claim coverage that is not supported by documents.
 */

export type VerificationStatus =
  | "confirmed"
  | "inferred"
  | "needs_verification"
  | "missing";

export const VERIFICATION_LABELS: Record<
  VerificationStatus,
  { short: string; long: string; symbol: string }
> = {
  confirmed: {
    short: "Confermato",
    long: "Confermato dalla polizza",
    symbol: "✓",
  },
  inferred: {
    short: "Derivato",
    long: "Derivato dai documenti con un certo margine di incertezza",
    symbol: "~",
  },
  needs_verification: {
    short: "Da verificare",
    long: "Da verificare nei documenti",
    symbol: "?",
  },
  missing: {
    short: "Mancante",
    long: "Informazione mancante nei documenti caricati",
    symbol: "!",
  },
};

export function verificationFromProvenance(
  provenance: "explicit" | "derived" | "unknown" | string | null | undefined,
  coverageStatus?: string | null
): VerificationStatus {
  if (coverageStatus === "unknown") return "needs_verification";
  if (provenance === "explicit") return "confirmed";
  if (provenance === "derived") return "inferred";
  return "needs_verification";
}

export function softCoveragePhrase(status: VerificationStatus): string {
  switch (status) {
    case "confirmed":
      return "Dai documenti caricati risulta";
    case "inferred":
      return "ATLAS ha trovato elementi che sembrano applicabili";
    case "needs_verification":
      return "Potrebbe applicarsi questa copertura; verifica le condizioni";
    case "missing":
      return "Non abbiamo trovato abbastanza informazioni per confermare";
  }
}

/** Never say "you are definitely covered". */
export const UNSUPPORTED_CLAIM_PHRASES = [
  "sei sicuramente coperto",
  "you are covered",
  "sei coperto al 100%",
  "copertura garantita",
] as const;
