import Link from "next/link";
import { FileText, PencilLine } from "lucide-react";
import { PolicyDeleteForm } from "@/components/policies/PolicyDeleteForm";
import { IconPolicies } from "@/components/icons";
import { ActionBar, ActionButton } from "@/components/ui/ActionBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatDateTime } from "@/lib/utils";
import type { UserPolicy } from "@/lib/types";

interface PolicyDetailSidebarProps {
  policy: UserPolicy;
}

export function PolicyDetailSidebar({ policy }: PolicyDetailSidebarProps) {
  return (
    <>
      <SectionCard title="Documento collegato" padding="sm">
        {policy.document ? (
          <Link
            href={`/documents/${policy.document.id}`}
            className="atlas-surface-card-interactive flex items-start gap-3 rounded-lg border border-border bg-accent-soft/50 p-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-accent shadow-sm">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-foreground">
                {policy.document.fileName}
              </span>
              <span className="mt-0.5 block text-[11px] text-accent">Apri PDF sorgente</span>
            </span>
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card-muted/50 px-3 py-4 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-[12px] font-medium text-foreground">PDF non collegato</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Collega un documento dalla sezione Documenti.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Azioni rapide" padding="sm">
        <ActionBar>
          <ActionButton href={`/policies/${policy.id}/edit`} variant="primary">
            <PencilLine className="h-4 w-4" />
            Modifica polizza
          </ActionButton>
          <PolicyDeleteForm policyId={policy.id} />
          <ActionButton href="/policies" variant="secondary">
            <IconPolicies className="h-4 w-4" />
            Portafoglio
          </ActionButton>
        </ActionBar>
      </SectionCard>

      <div className="rounded-xl border border-border bg-card-muted/60 px-3 py-2.5 text-[11px] text-muted">
        <p>Aggiornata {formatDateTime(policy.updatedAt)}</p>
        <p className="mt-0.5">Creata {formatDateTime(policy.createdAt)}</p>
      </div>
    </>
  );
}
