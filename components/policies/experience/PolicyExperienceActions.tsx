import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";

export function PolicyExperienceActions({
  policyId,
  documentId,
}: {
  policyId: string;
  documentId: string | null;
}) {
  return (
    <details className="relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border px-3 text-[12px] font-medium text-muted hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" aria-hidden />
        Azioni
      </summary>
      <div className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-card)]">
        <Link
          href={`/policies/${policyId}/edit`}
          className="block rounded-lg px-3 py-2 text-[12px] text-foreground hover:bg-card-muted"
        >
          Modifica
        </Link>
        {documentId ? (
          <Link
            href={`/documents/${documentId}`}
            className="block rounded-lg px-3 py-2 text-[12px] text-foreground hover:bg-card-muted"
          >
            Documento
          </Link>
        ) : null}
        <div className="border-t border-border-subtle px-1 pt-1">
          <PolicyDeleteForm policyId={policyId} />
        </div>
      </div>
    </details>
  );
}
