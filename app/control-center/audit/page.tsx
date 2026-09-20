import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { getPlatformAuditLog } from "@/lib/control-center-operations";

export const metadata = { title: "Audit | Control Center" };

export default async function ControlCenterAuditPage() {
  const rows = await getPlatformAuditLog(300);

  return (
    <>
      <OperationsHeader
        eyebrow="Compliance"
        title="Audit log"
        description="Operazioni admin sensibili: approvazioni partner, ruoli, assegnazioni, commissioni."
      />
      <OperationsPanel title={`${rows.length} eventi`}>
        {!rows.length ? (
          <p className="text-[12px] text-muted">Nessun evento ancora registrato.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-2">Quando</th>
                  <th className="pb-2">Evento</th>
                  <th className="pb-2">Actor</th>
                  <th className="pb-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2">{formatDate(row.created_at)}</td>
                    <td className="font-medium">{row.event_type}</td>
                    <td>
                      {row.actor_role ?? "—"}
                      <span className="block text-[10px] text-muted">
                        {row.actor_id ? String(row.actor_id).slice(0, 8) : "—"}
                      </span>
                    </td>
                    <td>
                      {row.target_type ?? "—"}
                      <span className="block text-[10px] text-muted">
                        {row.target_id ? String(row.target_id).slice(0, 8) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
