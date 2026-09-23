import "server-only";

import { createHash } from "crypto";
import { softCoveragePhrase, type VerificationStatus } from "@/lib/insurance-os/verification";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PolicyCoverage, UserDocument, UserPolicy } from "@/lib/types";
import { sumPortfolioPremiums } from "@/lib/premium-totals";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getUpcomingDeadlines } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";

import type {
  AskAtlasResult,
  AtlasSourceRef,
  AtlasStructuredAnswer,
} from "@/lib/insurance-os/ask-types";

export type { AskAtlasResult, AtlasSourceRef, AtlasStructuredAnswer };

type PortfolioContext = {
  policies: UserPolicy[];
  documents: UserDocument[];
  coverages: PolicyCoverage[];
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/[^a-z0-9àèéìòù]+/i)
    .filter((t) => t.length > 2);
}

/**
 * Targeted retrieval over structured portfolio — never dumps all PDFs to the model.
 */
export function retrieveRelevantFacts(
  question: string,
  ctx: PortfolioContext,
  limit = 12
): { policies: UserPolicy[]; coverages: PolicyCoverage[]; documents: UserDocument[]; score: number } {
  const tokens = tokenize(question);
  if (tokens.length === 0) {
    return { policies: ctx.policies.slice(0, 5), coverages: ctx.coverages.slice(0, 8), documents: [], score: 0 };
  }

  const scoredPolicies = ctx.policies
    .map((p) => {
      const hay = [
        p.provider,
        p.policyType,
        p.policyCategoryLabel,
        p.policyNumber,
        getPolicyTypeLabel(p.policyType, p.policyCategoryLabel),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 2 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoredCoverages = ctx.coverages
    .map((c) => {
      const hay = `${c.originalLabel} ${c.canonicalType} ${c.insuranceCategory} ${c.evidence ?? ""}`.toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 2 : 0), 0);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const policyHits = scoredPolicies.slice(0, 5).map((x) => x.p);
  const coverageHits = scoredCoverages.slice(0, limit).map((x) => x.c);
  const totalScore =
    scoredPolicies.reduce((a, x) => a + x.score, 0) +
    scoredCoverages.reduce((a, x) => a + x.score, 0);

  // If nothing matched keywords, fall back to portfolio-level questions only
  if (totalScore === 0) {
    return { policies: ctx.policies, coverages: [], documents: ctx.documents.slice(0, 3), score: 0 };
  }

  const docIds = new Set(
    coverageHits.map((c) => c.sourceDocumentId).filter(Boolean) as string[]
  );
  for (const p of policyHits) {
    if (p.documentId) docIds.add(p.documentId);
  }

  return {
    policies: policyHits.length ? policyHits : ctx.policies.slice(0, 3),
    coverages: coverageHits,
    documents: ctx.documents.filter((d) => docIds.has(d.id)),
    score: totalScore,
  };
}

function answerFromStructure(question: string, ctx: PortfolioContext): AskAtlasResult | null {
  const q = question.toLowerCase();
  const premiums = sumPortfolioPremiums(ctx.policies);
  const sources: AtlasSourceRef[] = ctx.policies.slice(0, 8).map((p) => ({
    kind: "policy" as const,
    id: p.id,
    label: `${p.provider} · ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}`,
    href: `/policies/${p.id}`,
  }));

  if (
    /quanto pago|premio totale|costo annuale|spendo|totale all.?anno|annual premium/i.test(q)
  ) {
    if (premiums.annual === null) {
      return {
        answer:
          "Non ho abbastanza informazioni nei documenti caricati per calcolare il premio annuale totale. Aggiungi i premi mancanti sulle polizze.",
        structured: {
          summary: "Premio annuale non calcolabile",
          sections: [],
          verificationStatus: "missing",
          insufficientData: true,
        },
        sources,
        verificationStatus: "missing",
      };
    }
    return {
      answer: `Dai documenti e dati caricati, il costo annuale noto è ${formatCHF(premiums.annual)}${
        premiums.monthly != null ? ` (circa ${formatCHF(premiums.monthly)} al mese)` : ""
      }. Se alcune polizze non hanno premio, il totale è parziale.`,
      structured: {
        summary: `Costo annuale noto: ${formatCHF(premiums.annual)}`,
        sections: [
          {
            title: "Nota",
            body: "Somma basata solo sulle polizze con premio noto. Non è un consiglio finanziario.",
          },
        ],
        verificationStatus: "inferred",
        insufficientData: false,
      },
      sources,
      verificationStatus: "inferred",
    };
  }

  if (/franchigia|deductible|franchise/i.test(q)) {
    const withDed = ctx.policies.filter((p) => p.deductible != null);
    if (withDed.length === 0) {
      return {
        answer:
          "Non ho trovato franchigie nei dati strutturati delle tue polizze. Controlla i PDF o completa i campi.",
        structured: {
          summary: "Franchigie non trovate",
          sections: [],
          verificationStatus: "missing",
          insufficientData: true,
        },
        sources: [],
        verificationStatus: "missing",
      };
    }
    const lines = withDed
      .map(
        (p) =>
          `• ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)} (${p.provider}): ${formatCHF(p.deductible!)}`
      )
      .join("\n");
    return {
      answer: `Dai documenti caricati risultano queste franchigie:\n${lines}`,
      structured: {
        summary: "Franchigie trovate",
        sections: [{ title: "Dettaglio", body: lines }],
        verificationStatus: "inferred",
        insufficientData: false,
      },
      sources: withDed.map((p) => ({
        kind: "policy" as const,
        id: p.id,
        label: p.provider,
        href: `/policies/${p.id}`,
      })),
      verificationStatus: "inferred",
    };
  }

  if (/scad|rinnov|disdett|prossimi \d+ mesi|quando posso/i.test(q)) {
    const deadlines = getUpcomingDeadlines(ctx.policies, new Date(), 10);
    if (deadlines.length === 0) {
      return {
        answer:
          "Non ho abbastanza date di scadenza/rinnovo nei documenti caricati per rispondere.",
        structured: {
          summary: "Scadenze non disponibili",
          sections: [],
          verificationStatus: "missing",
          insufficientData: true,
        },
        sources: [],
        verificationStatus: "missing",
      };
    }
    const body = deadlines
      .map((d) => `• ${d.label}: ${d.date} (${d.daysUntil} g)`)
      .join("\n");
    return {
      answer: `Ecco le scadenze/rinnovi noti:\n${body}\nPer i termini di disdetta precisi serve spesso la clausola nel PDF — se non è estratta, verifica il documento.`,
      structured: {
        summary: "Scadenze note",
        sections: [{ title: "Elenco", body }],
        verificationStatus: "inferred",
        insufficientData: false,
      },
      sources: deadlines.map((d) => ({
        kind: "policy" as const,
        id: d.policyId,
        label: d.label,
        href: `/policies/${d.policyId}`,
      })),
      verificationStatus: "inferred",
    };
  }

  if (/due coperture|sovrapposizion|simil|duplic/i.test(q)) {
    const byType = new Map<string, UserPolicy[]>();
    for (const p of ctx.policies) {
      const list = byType.get(p.policyType) ?? [];
      list.push(p);
      byType.set(p.policyType, list);
    }
    const overlaps = [...byType.entries()].filter(([, g]) => g.length >= 2);
    if (overlaps.length === 0) {
      return {
        answer:
          "Non ho trovato polizze dello stesso tipo che sembrino sovrapporsi. Questo non esclude sovrapposizioni tra prodotti diversi.",
        structured: {
          summary: "Nessuna sovrapposizione ovvia",
          sections: [],
          verificationStatus: "inferred",
          insufficientData: false,
        },
        sources,
        verificationStatus: "inferred",
      };
    }
    const body = overlaps
      .map(
        ([type, group]) =>
          `• ${getPolicyTypeLabel(type as UserPolicy["policyType"])}: ${group.map((p) => p.provider).join(", ")}`
      )
      .join("\n");
    return {
      answer: `Abbiamo trovato coperture che sembrano simili:\n${body}\nDa verificare — non significa che stai pagando due volte inutilmente.`,
      structured: {
        summary: "Possibili similarità",
        sections: [{ title: "Trovate", body }],
        verificationStatus: "needs_verification",
        insufficientData: false,
      },
      sources,
      verificationStatus: "needs_verification",
    };
  }

  if (/non (riesci|capisci)|mancan|incomple|cosa non/i.test(q)) {
    const missing: string[] = [];
    for (const p of ctx.policies) {
      if (p.premiumAmount == null)
        missing.push(`Premio mancante: ${p.provider}`);
      if (!p.documentId) missing.push(`Documento mancante: ${p.provider}`);
      if (p.requiresReview) missing.push(`Estrazione da verificare: ${p.provider}`);
    }
    if (missing.length === 0) {
      return {
        answer: "Al momento non risultano lacune evidenti nei campi principali. Restano comunque possibili clausole non estratte nei PDF.",
        structured: {
          summary: "Nessuna lacuna strutturale evidente",
          sections: [],
          verificationStatus: "inferred",
          insufficientData: false,
        },
        sources,
        verificationStatus: "inferred",
      };
    }
    return {
      answer: `Ecco cosa non è ancora chiaro dai tuoi documenti:\n${missing.map((m) => `• ${m}`).join("\n")}`,
      structured: {
        summary: "Informazioni incomplete",
        sections: [{ title: "Elenco", body: missing.join("\n") }],
        verificationStatus: "missing",
        insufficientData: true,
      },
      sources,
      verificationStatus: "missing",
    };
  }

  return null;
}

function synthesizeFromRetrieval(
  question: string,
  retrieved: ReturnType<typeof retrieveRelevantFacts>
): AskAtlasResult {
  if (retrieved.policies.length === 0 && retrieved.coverages.length === 0) {
    return {
      answer: "Non ho abbastanza informazioni nei documenti caricati.",
      structured: {
        summary: "Informazioni insufficienti",
        sections: [],
        verificationStatus: "missing",
        insufficientData: true,
      },
      sources: [],
      verificationStatus: "missing",
    };
  }

  const sources: AtlasSourceRef[] = [];
  for (const p of retrieved.policies) {
    sources.push({
      kind: "policy",
      id: p.id,
      label: `${p.provider} · ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}`,
      href: `/policies/${p.id}`,
    });
  }
  for (const c of retrieved.coverages.slice(0, 8)) {
    sources.push({
      kind: "coverage",
      id: c.id,
      label: c.originalLabel,
      href: `/policies/${c.policyId}`,
      page: c.sourcePage,
      evidence: c.evidence,
    });
  }

  const coverageLines = retrieved.coverages.slice(0, 8).map((c) => {
    const status =
      c.provenance === "explicit" ? "confirmed" : ("needs_verification" as VerificationStatus);
    return `• ${c.originalLabel} (${c.coverageStatus}) — ${softCoveragePhrase(status)}${
      c.sourcePage != null ? ` · pag. ${c.sourcePage}` : ""
    }`;
  });

  const policyLines = retrieved.policies.map(
    (p) =>
      `• ${p.provider}: ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}${
        p.premiumAmount != null ? ` · premio ${formatCHF(p.premiumAmount)}` : ""
      }`
  );

  const hasExplicit = retrieved.coverages.some((c) => c.provenance === "explicit");
  const verificationStatus: VerificationStatus = hasExplicit
    ? "inferred"
    : retrieved.score > 0
      ? "needs_verification"
      : "missing";

  if (retrieved.score === 0 && retrieved.coverages.length === 0) {
    return {
      answer:
        "Ho i tuoi dati di portafoglio, ma non trovo una corrispondenza specifica alla domanda nei documenti caricati. Prova a essere più preciso (es. nome polizza, franchigia, scadenza).",
      structured: {
        summary: "Corrispondenza debole",
        sections: [{ title: "Polizze nel portafoglio", body: policyLines.join("\n") }],
        verificationStatus: "needs_verification",
        insufficientData: true,
      },
      sources,
      verificationStatus: "needs_verification",
    };
  }

  const answer = [
    softCoveragePhrase(verificationStatus) + " quanto segue rispetto alla tua domanda.",
    "",
    "Polizze potenzialmente rilevanti:",
    ...policyLines,
    coverageLines.length ? "" : null,
    coverageLines.length ? "Coperture / clausole trovate:" : null,
    ...coverageLines,
    "",
    "Questa non è una consulenza legale definitiva. Verifica sempre le condizioni originali.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    answer,
    structured: {
      summary: "Risposta basata sui documenti caricati",
      sections: [
        { title: "Polizze", body: policyLines.join("\n") },
        ...(coverageLines.length
          ? [{ title: "Coperture", body: coverageLines.join("\n") }]
          : []),
        {
          title: "Limiti",
          body: "ATLAS non inventa condizioni generali assenti dai documenti.",
        },
      ],
      verificationStatus,
      insufficientData: false,
    },
    sources,
    verificationStatus,
  };
}

/**
 * Ask ATLAS: structured data first, then targeted retrieval + synthesis.
 * Optional LLM enrichment only when OPENAI_API_KEY is set AND structured path is weak —
 * still grounded on retrieved facts only (no free hallucination of coverage).
 */
export async function answerAskAtlas(
  question: string,
  ctx: PortfolioContext
): Promise<AskAtlasResult> {
  const trimmed = question.trim().slice(0, 2000);
  if (!trimmed) {
    return {
      answer: "Scrivi una domanda sulla tua situazione assicurativa.",
      structured: {
        summary: "Domanda vuota",
        sections: [],
        verificationStatus: "missing",
        insufficientData: true,
      },
      sources: [],
      verificationStatus: "missing",
    };
  }

  if (ctx.policies.length === 0) {
    return {
      answer:
        "Non ho ancora polizze nel tuo profilo. Carica la prima polizza: ATLAS la legge, estrae le coperture e costruisce il tuo quadro.",
      structured: {
        summary: "Portafoglio vuoto",
        sections: [],
        verificationStatus: "missing",
        insufficientData: true,
      },
      sources: [],
      verificationStatus: "missing",
    };
  }

  const structured = answerFromStructure(trimmed, ctx);
  if (structured) return structured;

  const retrieved = retrieveRelevantFacts(trimmed, ctx);
  const result = synthesizeFromRetrieval(trimmed, retrieved);

  // Optional grounded LLM polish — only rewrites wording of already-retrieved facts
  if (process.env.OPENAI_API_KEY && retrieved.score > 0 && !result.structured.insufficientData) {
    try {
      const polished = await polishGroundedAnswer(trimmed, result);
      if (polished) return polished;
    } catch {
      /* keep deterministic answer */
    }
  }

  return result;
}

async function polishGroundedAnswer(
  question: string,
  base: AskAtlasResult
): Promise<AskAtlasResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model =
    process.env.OPENAI_ASK_ATLAS_MODEL ??
    process.env.OPENAI_POLICY_EXTRACTION_MODEL_FAST ??
    "gpt-4o-mini";

  const system = `Sei ATLAS, assistente assicurativo personale. Rispondi in italiano, tono calmo e preciso.
Usa SOLO i fatti forniti. Non inventare coperture, limiti o esclusioni.
Non dire mai "sei sicuramente coperto". Preferisci "dai documenti caricati risulta...".
Se i fatti non bastano, dillo chiaramente.`;

  const user = JSON.stringify({
    question,
    base_answer: base.answer,
    sources: base.sources.map((s) => ({ label: s.label, page: s.page, evidence: s.evidence })),
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  return {
    ...base,
    answer: content,
  };
}

export async function persistAskExchange(input: {
  mode: "ask" | "what_if";
  question: string;
  result: AskAtlasResult;
  conversationId?: string | null;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let conversationId = input.conversationId ?? null;
  if (!conversationId) {
    const { data: conv } = await supabase
      .from("atlas_conversations")
      .insert({
        user_id: user.id,
        mode: input.mode,
        title: input.question.slice(0, 120),
      })
      .select("id")
      .single();
    conversationId = conv?.id ?? null;
  }
  if (!conversationId) return null;

  await supabase.from("atlas_messages").insert([
    {
      user_id: user.id,
      conversation_id: conversationId,
      role: "user",
      content: input.question.slice(0, 16000),
      structured_answer: {},
      sources: [],
    },
    {
      user_id: user.id,
      conversation_id: conversationId,
      role: "assistant",
      content: input.result.answer.slice(0, 16000),
      structured_answer: input.result.structured,
      sources: input.result.sources,
      verification_status: input.result.verificationStatus,
    },
  ]);

  return conversationId;
}

export function conversationIdempotencyKey(userId: string, question: string) {
  return createHash("sha256").update(`${userId}:${question.trim().toLowerCase()}`).digest("hex").slice(0, 24);
}
