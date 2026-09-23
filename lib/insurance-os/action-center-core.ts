/**
 * Pure action-center builders — safe for unit tests.
 */
import type { CoverageMapResult } from "@/lib/insurance-os/coverage-map-types";
import type { PolicyChangeEvent } from "@/lib/insurance-os/policy-diff-types";
import type {
  AttentionItemType,
  AttentionPriority,
} from "@/lib/insurance-os/shared-types";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getPolicyDeadlineDate } from "@/lib/policy-schedule";
import type { UserDocument, UserPolicy } from "@/lib/types";

const EXPIRING_WITHIN_DAYS = 60;

export type DynamicCandidate = {
  type: AttentionItemType;
  priority: AttentionPriority;
  title: string;
  description: string;
  policyId: string | null;
  documentId: string | null;
  ctaLabel: string;
  ctaHref: string;
  sourceKey: string;
};

export function detectPossibleOverlaps(policies: UserPolicy[]): DynamicCandidate[] {
  const byType = new Map<string, UserPolicy[]>();
  for (const policy of policies) {
    const list = byType.get(policy.policyType) ?? [];
    list.push(policy);
    byType.set(policy.policyType, list);
  }

  const items: DynamicCandidate[] = [];
  for (const [type, group] of byType) {
    if (group.length < 2) continue;
    if (type === "other" || type === "pet") continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        const label = getPolicyTypeLabel(a.policyType, a.policyCategoryLabel);
        items.push({
          type: "possible_overlap",
          priority: "info",
          title: "Coperture che sembrano simili",
          description: `Abbiamo trovato due polizze di tipo ${label} (${a.provider} e ${b.provider}). Potrebbero sovrapporsi in parte — da verificare, non è una conclusione finanziaria.`,
          policyId: a.id,
          documentId: null,
          ctaLabel: "Confronta",
          ctaHref: `/policies/${a.id}`,
          sourceKey: `atlas:possible_overlap:${[a.id, b.id].sort().join(":")}`,
        });
      }
    }
  }
  return items;
}

export function buildAttentionCandidates(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  coverageMap?: CoverageMapResult | null;
  changes?: PolicyChangeEvent[];
  openClaimCount?: number;
  pendingConsultation?: boolean;
  now?: Date;
}): DynamicCandidate[] {
  const now = input.now ?? new Date();
  const items: DynamicCandidate[] = [];

  for (const policy of input.policies) {
    const typeLabel = getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel);
    const deadline = getPolicyDeadlineDate(policy);

    if (deadline) {
      const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntil = Math.round(
        (deadline.timestamp - startOfToday) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil >= 0 && daysUntil <= EXPIRING_WITHIN_DAYS) {
        items.push({
          type: daysUntil <= 30 ? "upcoming_expiry" : "upcoming_renewal",
          priority: daysUntil <= 14 ? "important" : "attention",
          title:
            daysUntil === 0
              ? `${typeLabel}: scadenza oggi`
              : `${typeLabel}: scadenza tra ${daysUntil} giorni`,
          description: `Controlla rinnovo e condizioni di ${policy.provider}.`,
          policyId: policy.id,
          documentId: policy.documentId,
          ctaLabel: "Apri polizza",
          ctaHref: `/policies/${policy.id}`,
          sourceKey: `atlas:upcoming_expiry:${policy.id}:${deadline.date}`,
        });
      }
    }

    if (policy.premiumAmount === null) {
      items.push({
        type: "missing_premium",
        priority: "attention",
        title: "Premio non ancora noto",
        description: `Manca l’importo del premio per ${typeLabel}.`,
        policyId: policy.id,
        documentId: null,
        ctaLabel: "Completa",
        ctaHref: `/policies/${policy.id}/edit`,
        sourceKey: `atlas:missing_premium:${policy.id}`,
      });
    }

    if (!policy.documentId) {
      items.push({
        type: "missing_document",
        priority: "attention",
        title: "Documento principale mancante",
        description: `Carica il PDF aggiornato di ${typeLabel}.`,
        policyId: policy.id,
        documentId: null,
        ctaLabel: "Carica documento",
        ctaHref: "/documents",
        sourceKey: `atlas:missing_document:${policy.id}`,
      });
    }

    if (policy.requiresReview || policy.source === "ai_draft") {
      items.push({
        type: "parsing_incomplete",
        priority: "attention",
        title: "Estrazione da verificare",
        description: `ATLAS ha letto ${typeLabel}: conferma i dati prima di basarti sulle conclusioni.`,
        policyId: policy.id,
        documentId: policy.documentId,
        ctaLabel: "Verifica",
        ctaHref: `/policies/${policy.id}`,
        sourceKey: `atlas:parsing_incomplete:${policy.id}`,
      });
    }
  }

  for (const doc of input.documents) {
    if (doc.status === "failed") {
      items.push({
        type: "parsing_incomplete",
        priority: "attention",
        title: "Documento non analizzato",
        description: `${doc.fileName} non è stato letto correttamente.`,
        policyId: null,
        documentId: doc.id,
        ctaLabel: "Apri documento",
        ctaHref: `/documents/${doc.id}`,
        sourceKey: `atlas:doc_failed:${doc.id}`,
      });
    }
  }

  if (input.coverageMap) {
    for (const cat of input.coverageMap.categories) {
      for (const fact of cat.needsVerification.slice(0, 2)) {
        items.push({
          type: "coverage_needs_verification",
          priority: "info",
          title: `Da verificare: ${fact.label}`,
          description: `In ${cat.label} manca ancora chiarezza su questa copertura.`,
          policyId: fact.policyId,
          documentId: fact.sourceDocumentId,
          ctaLabel: "Vedi copertura",
          ctaHref: fact.policyId ? `/policies/${fact.policyId}` : "/dashboard",
          sourceKey: `atlas:coverage_verify:${fact.id}`,
        });
      }
    }
  }

  items.push(...detectPossibleOverlaps(input.policies));

  for (const change of input.changes ?? []) {
    if (change.changeType === "premium") {
      items.push({
        type: "premium_changed",
        priority: "info",
        title: "Premio aggiornato",
        description: change.displaySummary,
        policyId: change.policyId,
        documentId: change.sourceDocumentId,
        ctaLabel: "Vedi dettaglio",
        ctaHref: `/policies/${change.policyId}`,
        sourceKey: `atlas:premium_changed:${change.idempotencyKey}`,
      });
    }
  }

  if (input.pendingConsultation) {
    items.push({
      type: "consultation_pending",
      priority: "info",
      title: "Revisione con consulente in corso",
      description: "La tua richiesta è stata ricevuta. Nessun accesso automatico ai dati.",
      policyId: null,
      documentId: null,
      ctaLabel: "Vedi pratica",
      ctaHref: "/consulting",
      sourceKey: "atlas:consultation_pending:open",
    });
  }

  if ((input.openClaimCount ?? 0) > 0) {
    items.push({
      type: "claim_open",
      priority: "attention",
      title: "Hai un sinistro in preparazione",
      description: "Continua il dossier quando hai nuovi documenti.",
      policyId: null,
      documentId: null,
      ctaLabel: "Apri attività",
      ctaHref: "/activity?tab=claims",
      sourceKey: "atlas:claim_open:active",
    });
  }

  return items;
}
