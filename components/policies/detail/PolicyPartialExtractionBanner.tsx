import { ClipboardCheck, Sparkles } from "lucide-react";
import Link from "next/link";

type PolicyPartialExtractionBannerProps = {
  policyId: string;
  uncertainFieldCount: number;
  unassignedCount: number;
  missingFieldCount: number;
};

export function PolicyPartialExtractionBanner({
  policyId,
  uncertainFieldCount,
  unassignedCount,
  missingFieldCount,
}: PolicyPartialExtractionBannerProps) {
  const reviewItems = [
    uncertainFieldCount > 0
      ? `${uncertainFieldCount} campi incerti`
      : null,
    unassignedCount > 0 ? `${unassignedCount} coperture da assegnare` : null,
    missingFieldCount > 0 ? `${missingFieldCount} campi principali mancanti` : null,
  ].filter(Boolean);

  return (
    <div className="atlas-action-strip flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3.5 dark:border-amber-900/35 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--warning-bg)] text-[var(--warning-text)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            Atlas ha bisogno di verifica manuale
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            Alcuni dati non sono stati rilevati automaticamente. Conferma premio,
            persone e coperture per completare la bozza.
          </p>
          {reviewItems.length > 0 ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {reviewItems.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href={`/policies/${policyId}/edit`}
        className="atlas-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2.5 text-[12px]"
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        Avvia revisione
      </Link>
    </div>
  );
}
