import Link from "next/link";
import { claimCategoryLabel } from "@/lib/insurance-os/claims-client";
import type { InsuranceClaimView } from "@/lib/insurance-os/claims-view";
import { cn, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "In preparazione",
  ready: "Pronto da inviare",
  submitted_externally: "Inviato da te",
  in_progress: "In lavorazione",
  closed: "Chiuso",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "atlas-surface-muted text-muted",
  ready: "atlas-alert-success",
  submitted_externally: "atlas-alert-info",
  in_progress: "atlas-alert-info",
  closed: "atlas-surface-muted text-muted",
};

export function ClaimList({
  claims,
  emptyMessage = "Nessun dossier aperto. Quando succede qualcosa, ATLAS ti aiuta a preparare la pratica.",
}: {
  claims: InsuranceClaimView[];
  emptyMessage?: string;
}) {
  if (claims.length === 0) {
    return (
      <p className="atlas-consumer-card px-4 py-5 text-[13px] leading-relaxed text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {claims.map((claim) => {
        const requiredTotal = claim.checklist.filter((item) => item.required).length;
        const requiredDone = claim.checklist.filter(
          (item) => item.required && item.done
        ).length;

        return (
          <li key={claim.id}>
            <Link
              href={`/claims/${claim.id}`}
              className="atlas-consumer-card atlas-consumer-press block px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="atlas-section-eyebrow">{claimCategoryLabel(claim.category)}</p>
                  <p className="mt-1 truncate text-[14px] font-semibold tracking-tight text-foreground">
                    {claim.title}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    STATUS_STYLES[claim.status] ?? "atlas-surface-muted text-muted"
                  )}
                >
                  {STATUS_LABELS[claim.status] ?? claim.status}
                </span>
              </div>

              <p className="mt-2 text-[12px] text-muted">
                {claim.eventDate ? `Evento del ${formatDate(claim.eventDate)}` : "Data evento non indicata"}
                {requiredTotal > 0
                  ? ` · ${requiredDone}/${requiredTotal} elementi obbligatori`
                  : ""}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
