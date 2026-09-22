import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { PartnerBadge, PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
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

  return (
    <>
      <OperationsHeader
        eyebrow="Pipeline"
        title="Richieste assegnate"
        description="Vedi solo le richieste affidate al tuo profilo broker. Cambia stato in sicurezza dal menu."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/partner/leads"
          className={`rounded-lg border px-3 py-1.5 text-[12px] ${
            statusFilter === "all"
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-muted"
          }`}
        >
          Tutte ({leads.length})
        </Link>
        {stages.map((row) => (
          <Link
            key={row.id}
            href={`/partner/leads?status=${row.id}`}
            className={`rounded-lg border px-3 py-1.5 text-[12px] ${
              statusFilter === row.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted"
            }`}
          >
            {row.label} ({row.count})
          </Link>
        ))}
      </div>

      <OperationsPanel title={`${filtered.length} richieste`}>
        {!filtered.length ? (
          <PartnerEmptyState
            icon={BriefcaseBusiness}
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
                  return (
                    <tr key={lead.id}>
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
                        <PartnerBadge tone="accent">
                          {consultationStatusLabel(lead.status)}
                        </PartnerBadge>
                      </td>
                      <td className="py-3 text-muted">{deriveNextAction(lead.status)}</td>
                      <td className="py-3">
                        {contactMethodLabel(lead.preferredContactMethod)}
                      </td>
                      <td className="py-3">{formatDate(lead.updatedAt)}</td>
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
