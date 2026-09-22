import Link from "next/link";
import {
  OperationsPanel,
  formatDate,
  operationsInput,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerEmptyState,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import {
  consultationStatusLabel,
  consultationTypeLabel,
  contactMethodLabel,
} from "@/lib/operations-labels";
import {
  PARTNER_PIPELINE_STAGES,
  deriveNextAction,
  pipelineStageCounts,
} from "@/lib/partner-workspace";
import { transitionLeadAction } from "@/app/partner/actions";

export const metadata = { title: "Richieste | Partner" };

const nextStatuses: Record<string, string[]> = {
  assigned: ["contacted", "lost", "cancelled"],
  submitted: ["contacted", "lost", "cancelled"],
  contacted: ["consultation_scheduled", "lost", "cancelled"],
  consultation_scheduled: ["in_review", "lost", "cancelled"],
  in_review: ["quoted", "lost", "completed"],
  quoted: ["won", "lost", "in_review"],
};

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-[12px] transition ${
    active
      ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
      : "border-border text-muted hover:border-accent/40 hover:text-foreground"
  }`;

export default async function BrokerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const { leads } = await getBrokerWorkspace();
  const stages = pipelineStageCounts(leads);
  const stage = PARTNER_PIPELINE_STAGES.find((row) => row.id === statusFilter);
  const filtered = stage
    ? leads.filter((lead) => (stage.statuses as readonly string[]).includes(lead.status))
    : leads;
  const needsAction = leads.filter((l) =>
    ["assigned", "submitted", "quoted"].includes(l.status)
  ).length;

  return (
    <>
      <PartnerPageIntro
        area="leads"
        eyebrow="Pipeline"
        title="Richieste assegnate"
        description="Solo le consulenze affidate al tuo profilo. Cambia stato in sicurezza dal menu."
        actions={
          needsAction > 0 ? (
            <PartnerBadge tone="warn">{needsAction} da lavorare</PartnerBadge>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/partner/leads" className={chip(statusFilter === "all")}>
          Tutte ({leads.length})
        </Link>
        {stages.map((row) => (
          <Link
            key={row.id}
            href={`/partner/leads?status=${row.id}`}
            className={chip(statusFilter === row.id)}
          >
            {row.label} ({row.count})
          </Link>
        ))}
      </div>

      <OperationsPanel title={`${filtered.length} richieste`}>
        {!filtered.length ? (
          <PartnerEmptyState
            area="leads"
            title="Nessuna richiesta"
            description={
              stage
                ? `Nessuna richiesta nello stato «${stage.label}».`
                : "Quando ATLAS ti assegna una consulenza, compare qui."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Stato</th>
                  <th className="pb-3">Prossima azione</th>
                  <th className="pb-3">Contatto</th>
                  <th className="pb-3">Aggiornata</th>
                  <th className="pb-3">Cambio stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead) => {
                  const transitions = nextStatuses[lead.status] ?? [];
                  const urgent = ["assigned", "submitted"].includes(lead.status);
                  return (
                    <tr
                      key={lead.id}
                      className={urgent ? "bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]" : undefined}
                    >
                      <td className="py-3">
                        <Link
                          className="font-semibold text-accent"
                          href={`/partner/leads/${lead.id}`}
                        >
                          {lead.clientName}
                        </Link>
                        <p className="text-[10px] text-muted">
                          {consultationTypeLabel(lead.requestType)}
                        </p>
                      </td>
                      <td className="py-3">
                        <PartnerBadge tone={urgent ? "warn" : "accent"}>
                          {consultationStatusLabel(lead.status)}
                        </PartnerBadge>
                      </td>
                      <td className="py-3 text-muted">{deriveNextAction(lead.status)}</td>
                      <td className="py-3">
                        {contactMethodLabel(lead.preferredContactMethod)}
                      </td>
                      <td className="py-3 tabular-nums">{formatDate(lead.updatedAt)}</td>
                      <td className="py-3">
                        {transitions.length ? (
                          <form
                            action={transitionLeadAction}
                            className="flex items-center gap-2"
                          >
                            <input type="hidden" name="request_id" value={lead.id} />
                            <select
                              name="status"
                              className={`${operationsInput} min-w-[9rem]`}
                              aria-label={`Cambia stato ${lead.clientName}`}
                              defaultValue={transitions[0]}
                            >
                              {transitions.map((status) => (
                                <option key={status} value={status}>
                                  {consultationStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                            <button className="rounded-lg border border-border px-2 py-2 text-[11px] hover:border-accent">
                              Vai
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-muted">Chiusa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
