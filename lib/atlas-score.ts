import type { CurrentProfile, UserDocument, UserPolicy } from "@/lib/types";

export type AtlasScoreFactor = {
  id: string;
  label: string;
  done: boolean;
  points: number;
};

export type AtlasScore = {
  score: number;
  max: number;
  factors: AtlasScoreFactor[];
  headline: string;
  disclaimer: string;
};

function hasPremium(policy: UserPolicy) {
  return policy.premiumAmount !== null && Number.isFinite(policy.premiumAmount);
}

function hasSchedule(policy: UserPolicy) {
  return Boolean(policy.renewalDate || policy.endDate || policy.startDate);
}

export function buildAtlasScore(input: {
  profile: CurrentProfile | null;
  policies: UserPolicy[];
  documents: UserDocument[];
}): AtlasScore {
  const types = new Set(input.policies.map((policy) => policy.policyType));
  const factors: AtlasScoreFactor[] = [
    {
      id: "name",
      label: "Nome sul profilo",
      done: Boolean(input.profile?.fullName?.trim()),
      points: 12,
    },
    {
      id: "phone",
      label: "Telefono sul profilo",
      done: Boolean(input.profile?.phone?.trim()),
      points: 8,
    },
    {
      id: "policy",
      label: "Almeno una polizza",
      done: input.policies.length > 0,
      points: 22,
    },
    {
      id: "premium",
      label: "Premio indicato",
      done: input.policies.some(hasPremium),
      points: 16,
    },
    {
      id: "dates",
      label: "Date di polizza",
      done: input.policies.some(hasSchedule),
      points: 16,
    },
    {
      id: "document",
      label: "Documento caricato",
      done: input.documents.length > 0,
      points: 16,
    },
    {
      id: "categories",
      label: "Più categorie coperte",
      done: types.size >= 2,
      points: 10,
    },
  ];

  const score = Math.min(
    100,
    factors.reduce((sum, factor) => sum + (factor.done ? factor.points : 0), 0)
  );

  let headline = "Inizia ad aggiungere le tue assicurazioni.";
  if (score >= 85) {
    headline = "I dati nel tuo account sono quasi completi.";
  } else if (score >= 55) {
    headline = "Buona base: mancano ancora alcuni dati.";
  } else if (score >= 25) {
    headline = "Il profilo sta prendendo forma.";
  }

  return {
    score,
    max: 100,
    factors,
    headline,
    disclaimer:
      "ATLAS Score è un indice di completezza dei dati nel tuo account. Non è una valutazione delle coperture né una raccomandazione assicurativa.",
  };
}
