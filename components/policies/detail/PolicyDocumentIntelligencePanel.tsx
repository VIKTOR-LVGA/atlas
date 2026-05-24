import Link from "next/link";
import { CheckCircle2, Clock3, FileText, Sparkles } from "lucide-react";
import {
  getExtractionConfidenceLabel,
  getExtractionConfidenceTier,
} from "@/lib/policy-extraction-reveal";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { UserPolicy } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type PolicyDocumentIntelligencePanelProps = {
  policy: UserPolicy;
};

export function PolicyDocumentIntelligencePanel({
  policy,
}: PolicyDocumentIntelligencePanelProps) {
  const confidenceTier = getExtractionConfidenceTier(policy.extractionConfidence);
  const hasExtraction =
    policy.source === "ai_draft" || policy.extractionConfidence !== null;

  return (
    <SectionCard title="Intelligence documento" padding="sm" tone="support">
      <ul className="space-y-2.5 text-[12px]">
        <li className="flex items-start justify-between gap-3">
          <span className="text-muted">PDF sorgente</span>
          {policy.document ? (
            <Link
              href={`/documents/${policy.document.id}`}
              className="inline-flex min-w-0 items-center gap-1 font-medium text-accent hover:underline"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{policy.document.fileName}</span>
            </Link>
          ) : (
            <span className="font-medium text-muted-foreground">Non collegato</span>
          )}
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">Estrazione</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            {hasExtraction ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success-text)]" />
                Completata
              </>
            ) : (
              "Manuale"
            )}
          </span>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">Affidabilità</span>
          <span className="font-medium text-foreground">
            {getExtractionConfidenceLabel(confidenceTier)}
            {policy.extractionConfidence !== null
              ? ` (${Math.round(policy.extractionConfidence)}%)`
              : ""}
          </span>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">Stato bozza</span>
          {policy.requiresReview ? (
            <StatusBadge variant="attention" label="Da confermare" />
          ) : (
            <StatusBadge variant="ok" label="Verificata" />
          )}
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="text-muted">Origine</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            {policy.source === "ai_draft" ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Bozza AI
              </>
            ) : (
              "Inserimento manuale"
            )}
          </span>
        </li>
        <li className="flex items-start justify-between gap-3 border-t border-border-subtle pt-2.5">
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock3 className="h-3.5 w-3.5" />
            Analisi
          </span>
          <span className="text-right text-[11px] leading-snug text-muted-foreground">
            Creata {formatDateTime(policy.createdAt)}
            <br />
            Aggiornata {formatDateTime(policy.updatedAt)}
          </span>
        </li>
      </ul>
      {policy.extractionNotes ? (
        <p className="mt-3 rounded-lg border border-border-subtle bg-card-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
          {policy.extractionNotes}
        </p>
      ) : null}
    </SectionCard>
  );
}
