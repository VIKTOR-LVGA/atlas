import Link from "next/link";
import { ArrowRight, FileText, Shield } from "lucide-react";
import type { DocumentIntelligenceView } from "@/lib/document-intelligence";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCHF } from "@/lib/utils";

type DocumentPolicyConnectionProps = {
  view: DocumentIntelligenceView;
};

export function DocumentPolicyConnection({ view }: DocumentPolicyConnectionProps) {
  const { document, linkedPolicy } = view;

  if (!linkedPolicy) {
    return (
      <SectionCard title="Collegamento polizza" padding="sm" tone="support">
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-card-muted/50 px-3 py-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              {document.status === "analyzed"
                ? "Polizza non collegata"
                : "In attesa analisi"}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              {document.status === "analyzed"
                ? "L'analisi è completata ma non risulta una scheda collegata. Apri il dettaglio o rianalizza."
                : "Dopo l'analisi AI, Atlas creerà una bozza polizza strutturata da questo PDF."}
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  const policyTypeLabel = getPolicyTypeLabel(
    linkedPolicy.policyType,
    linkedPolicy.policyCategoryLabel
  );

  return (
    <SectionCard
      title="Da PDF a entità assicurativa"
      description="Questo documento ha generato la scheda sottostante"
      padding="sm"
      tone="primary"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            variant={linkedPolicy.requiresReview ? "attention" : "ok"}
            label={linkedPolicy.requiresReview ? "Da confermare" : "Verificata"}
          />
          {linkedPolicy.source === "ai_draft" ? (
            <StatusBadge variant="neutral" label="Bozza AI" />
          ) : null}
        </div>

        <div className="rounded-xl border border-border-subtle bg-card-muted/40 p-3.5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-foreground">
                {linkedPolicy.provider?.trim() || "Compagnia non disponibile"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {policyTypeLabel}
                {linkedPolicy.policyNumber?.trim()
                  ? ` · ${linkedPolicy.policyNumber.trim()}`
                  : ""}
              </p>
              <p className="mt-1.5 text-[12px] tabular-nums text-foreground">
                {linkedPolicy.premiumAmount !== null
                  ? formatCHF(linkedPolicy.premiumAmount)
                  : "Premio non disponibile"}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/policies/${linkedPolicy.id}`}
          className="atlas-btn-primary inline-flex w-full items-center justify-center gap-2 py-2.5 text-[13px]"
        >
          Apri polizza strutturata
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-center text-[10px] text-muted">
          PDF sorgente → estrazione → bozza → revisione
        </p>
      </div>
    </SectionCard>
  );
}
