import "server-only";

import {
  answerAskAtlas,
  persistAskExchange,
  retrieveRelevantFacts,
} from "@/lib/insurance-os/ask-atlas";
import type { AtlasSourceRef, WhatIfResult } from "@/lib/insurance-os/ask-types";
import { softCoveragePhrase, type VerificationStatus } from "@/lib/insurance-os/verification";
import type { PolicyCoverage, UserDocument, UserPolicy } from "@/lib/types";
import { getPolicyTypeLabel } from "@/lib/policy-types";

export type { WhatIfResult } from "@/lib/insurance-os/ask-types";

const SCENARIO_HINTS: Array<{ pattern: RegExp; categories: string[]; policyTypes: string[] }> = [
  {
    pattern: /telefon|furto|rubat|vacanz|viagg|bagagl/i,
    categories: ["travel", "household"],
    policyTypes: ["travel", "household"],
  },
  {
    pattern: /acqua|allag|infiltraz|appartament|casa|mobilia|tv|rottur/i,
    categories: ["household", "building", "private_liability"],
    policyTypes: ["household", "building", "liability"],
  },
  {
    pattern: /auto|incident|guid|veicol|casco/i,
    categories: ["vehicle"],
    policyTypes: ["car"],
  },
  {
    pattern: /figlio|amico|rc|responsabilit|danno a terzi/i,
    categories: ["private_liability"],
    policyTypes: ["liability"],
  },
  {
    pattern: /salut|infortun|ospedal/i,
    categories: ["health_basic", "health_supplementary", "accident"],
    policyTypes: ["health"],
  },
  {
    pattern: /legal|avvocato|giuridic/i,
    categories: ["legal_protection"],
    policyTypes: ["legal"],
  },
];

export async function analyzeWhatIfScenario(input: {
  scenario: string;
  policies: UserPolicy[];
  documents: UserDocument[];
  coverages: PolicyCoverage[];
}): Promise<WhatIfResult> {
  const scenario = input.scenario.trim().slice(0, 2000);
  const hint = SCENARIO_HINTS.find((h) => h.pattern.test(scenario));

  let policies = input.policies;
  if (hint) {
    const matched = input.policies.filter((p) => hint.policyTypes.includes(p.policyType));
    if (matched.length) policies = matched;
  }

  const coverages =
    hint != null
      ? input.coverages.filter(
          (c) =>
            hint.categories.includes(c.insuranceCategory) ||
            policies.some((p) => p.id === c.policyId)
        )
      : input.coverages;

  const retrieved = retrieveRelevantFacts(scenario, {
    policies,
    documents: input.documents,
    coverages,
  });

  const relevantPolicies = (retrieved.policies.length ? retrieved.policies : policies).map(
    (p) => ({
      id: p.id,
      label: getPolicyTypeLabel(p.policyType, p.policyCategoryLabel),
      provider: p.provider,
      href: `/policies/${p.id}`,
    })
  );

  const findings: string[] = [];
  const uncertainties: string[] = [];
  const sources: AtlasSourceRef[] = [];

  for (const c of retrieved.coverages.slice(0, 10)) {
    const vs: VerificationStatus =
      c.provenance === "explicit" && c.coverageStatus === "included"
        ? "confirmed"
        : c.coverageStatus === "excluded"
          ? "confirmed"
          : "needs_verification";

    if (c.coverageStatus === "excluded") {
      findings.push(
        `Esclusione rilevata: «${c.originalLabel}»${c.sourcePage != null ? ` (pag. ${c.sourcePage})` : ""}`
      );
    } else if (c.coverageStatus === "included" || c.coverageStatus === "conditional") {
      findings.push(
        `${softCoveragePhrase(vs)} una copertura «${c.originalLabel}»${
          c.deductible != null ? ` · franchigia ${c.deductible}` : ""
        }${c.coverageLimit != null ? ` · limite ${c.coverageLimit}` : ""}`
      );
    } else {
      uncertainties.push(`Stato incerto per «${c.originalLabel}»`);
    }

    sources.push({
      kind: "coverage",
      id: c.id,
      label: c.originalLabel,
      href: `/policies/${c.policyId}`,
      page: c.sourcePage,
      evidence: c.evidence,
    });
  }

  if (findings.length === 0) {
    uncertainties.push(
      "Non abbiamo trovato abbastanza informazioni nei documenti caricati per confermare una copertura specifica per questo scenario."
    );
  }

  const suggestedActions = [
    "Raccogli data, luogo e descrizione dell’evento",
    "Controlla le polizze potenzialmente rilevanti e le franchigie",
    findings.length
      ? "Se l’evento è reale, apri Claim Mode per preparare un dossier"
      : "Carica eventuali CGA / condizioni mancanti per migliorare l’analisi",
  ];

  const answer = await answerAskAtlas(
    `Scenario: ${scenario}. Quali polizze e clausole risultano dai documenti?`,
    {
      policies: retrieved.policies.length ? retrieved.policies : policies,
      documents: input.documents,
      coverages: retrieved.coverages.length ? retrieved.coverages : coverages,
    }
  );

  const verificationStatus: VerificationStatus =
    findings.length === 0
      ? "missing"
      : uncertainties.length
        ? "needs_verification"
        : "inferred";

  return {
    scenario,
    relevantPolicies,
    findings,
    uncertainties,
    suggestedActions,
    sources: sources.length ? sources : answer.sources,
    verificationStatus,
    answer,
  };
}

export async function runWhatIfAndPersist(input: {
  scenario: string;
  policies: UserPolicy[];
  documents: UserDocument[];
  coverages: PolicyCoverage[];
}) {
  const result = await analyzeWhatIfScenario(input);
  const conversationId = await persistAskExchange({
    mode: "what_if",
    question: input.scenario,
    result: {
      answer: [
        "Potrebbero entrare in gioco:",
        ...result.relevantPolicies.map((p) => `• ${p.provider} — ${p.label}`),
        "",
        "Cosa abbiamo trovato:",
        ...(result.findings.length ? result.findings.map((f) => `• ${f}`) : ["• Nessuna copertura confermata"]),
        "",
        "Da verificare:",
        ...result.uncertainties.map((u) => `• ${u}`),
        "",
        "Se succedesse davvero:",
        ...result.suggestedActions.map((a) => `• ${a}`),
      ].join("\n"),
      structured: {
        summary: "Analisi scenario",
        sections: [
          { title: "Polizze", body: result.relevantPolicies.map((p) => p.label).join(", ") },
          { title: "Trovato", body: result.findings.join("\n") },
          { title: "Incertezze", body: result.uncertainties.join("\n") },
        ],
        verificationStatus: result.verificationStatus,
        insufficientData: result.verificationStatus === "missing",
      },
      sources: result.sources,
      verificationStatus: result.verificationStatus,
    },
  });

  return { result, conversationId };
}
