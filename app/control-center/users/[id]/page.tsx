import { notFound } from "next/navigation";
import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { getAdminUserDetail } from "@/lib/control-center-operations";
import {
  consultationStatusLabel,
  contractStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Dettaglio utente | Control Center" };

export default async function ControlCenterUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminUserDetail(id);
  if (!data) notFound();

  return (
    <>
      <OperationsHeader
        eyebrow={`Ruolo · ${data.role}`}
        title={data.profile.full_name ?? "Utente ATLAS"}
        description="Sintesi operativa. I contenuti PDF non vengono aperti automaticamente."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationsMetric label="Polizze" value={String(data.policies.length)} />
        <OperationsMetric label="Documenti" value={String(data.documents.length)} />
        <OperationsMetric label="Opportunità" value={String(data.opportunities.length)} />
        <OperationsMetric label="Consulenze" value={String(data.consultations.length)} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Account">
          <dl className="grid gap-2 text-[12px]">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{data.profile.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Telefono</dt>
              <dd>{data.profile.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Registrato</dt>
              <dd>{formatDate(data.profile.created_at)}</dd>
            </div>
          </dl>
        </OperationsPanel>
        <OperationsPanel title="Polizze (metadati)">
          {!data.policies.length ? (
            <p className="text-[12px] text-muted">Nessuna polizza.</p>
          ) : (
            <ul className="space-y-2 text-[12px]">
              {data.policies.map((policy) => (
                <li key={policy.id} className="rounded-lg border border-border p-2">
                  {policy.provider} · {policy.policy_type}
                </li>
              ))}
            </ul>
          )}
        </OperationsPanel>
        <OperationsPanel title="Documenti (solo elenco)">
          {!data.documents.length ? (
            <p className="text-[12px] text-muted">Nessun documento.</p>
          ) : (
            <ul className="space-y-2 text-[12px]">
              {data.documents.map((doc) => (
                <li key={doc.id} className="rounded-lg border border-border p-2">
                  {doc.file_name} · {doc.status}
                  <span className="float-right text-[10px] text-muted">
                    {formatDate(doc.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OperationsPanel>
        <OperationsPanel title="Consulenze e contratti">
          <ul className="space-y-2 text-[12px]">
            {data.consultations.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-2">
                {consultationStatusLabel(row.status)} · {row.request_type}
              </li>
            ))}
            {data.contracts.map((row) => (
              <li key={row.id} className="rounded-lg border border-border p-2">
                {row.insurer} · {contractStatusLabel(row.status)}
              </li>
            ))}
            {!data.consultations.length && !data.contracts.length ? (
              <li className="text-muted">Nessuna attività intermediazione.</li>
            ) : null}
          </ul>
        </OperationsPanel>
      </div>
    </>
  );
}
