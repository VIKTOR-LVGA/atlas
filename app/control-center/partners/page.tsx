import Link from "next/link";
import { setBrokerActiveAction } from "@/app/control-center/actions";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
  operationsButton,
} from "@/components/operations/OperationsUi";
import { getAdminWorkspace } from "@/lib/admin-operations";
import { listPartnerApplicationsForAdmin } from "@/lib/partner-applications";

export const metadata = { title: "Partner | Control Center" };

export default async function ControlCenterPartnersPage() {
  const [applications, workspace] = await Promise.all([
    listPartnerApplicationsForAdmin(),
    getAdminWorkspace(),
  ]);

  const grouped = {
    applications: applications.filter((a) =>
      ["submitted", "under_review", "draft"].includes(String(a.status))
    ),
    active: workspace.brokers.filter((b) => b.active),
    suspended: workspace.brokers.filter((b) => !b.active),
    rejected: applications.filter((a) => a.status === "rejected"),
  };

  return (
    <>
      <OperationsHeader
        eyebrow="Onboarding"
        title="Partner e candidature"
        description="Approvazione, sospensione e attivazione broker. Nessuna auto-promozione lato utente."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title={`Applications (${grouped.applications.length})`}>
          <div className="space-y-3">
            {grouped.applications.map((app) => (
              <div key={String(app.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  <Link
                    href={`/control-center/partners/applications/${String(app.id)}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    {String(app.first_name)} {String(app.last_name)}
                  </Link>
                  <span className="float-right text-accent">{String(app.status)}</span>
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {String(app.organization_name ?? app.professional_email)} ·{" "}
                  {formatDate(String(app.created_at))}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/control-center/partners/applications/${String(app.id)}`}
                    className={operationsButton}
                  >
                    Apri candidatura
                  </Link>
                </div>
              </div>
            ))}
            {!grouped.applications.length ? (
              <div className="rounded-lg border border-dashed border-border bg-card-muted/20 px-4 py-6 text-center">
                <p className="text-[13px] font-medium text-foreground">
                  Nessuna candidatura Partner
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  Le nuove richieste da Privato → Broker compariranno qui per
                  revisione e approvazione.
                </p>
              </div>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Active (${grouped.active.length})`}>
          <div className="space-y-2">
            {grouped.active.map((broker) => (
              <div
                key={broker.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-[12px]"
              >
                <div>
                  <Link
                    href={`/control-center/partners/${broker.id}`}
                    className="font-semibold text-accent"
                  >
                    {broker.display_name}
                  </Link>
                  <p className="text-[10px] text-muted">{broker.email}</p>
                </div>
                <form action={setBrokerActiveAction}>
                  <input type="hidden" name="broker_id" value={broker.id} />
                  <input type="hidden" name="active" value="false" />
                  <button className={operationsButton}>Sospendi</button>
                </form>
              </div>
            ))}
            {!grouped.active.length ? (
              <p className="text-[12px] text-muted">Nessun partner attivo.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Suspended (${grouped.suspended.length})`}>
          <div className="space-y-2">
            {grouped.suspended.map((broker) => (
              <div
                key={broker.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-[12px]"
              >
                <span className="font-semibold">{broker.display_name}</span>
                <form action={setBrokerActiveAction}>
                  <input type="hidden" name="broker_id" value={broker.id} />
                  <input type="hidden" name="active" value="true" />
                  <button className={operationsButton}>Riattiva</button>
                </form>
              </div>
            ))}
            {!grouped.suspended.length ? (
              <p className="text-[12px] text-muted">Nessun partner sospeso.</p>
            ) : null}
          </div>
        </OperationsPanel>

        <OperationsPanel title={`Rejected (${grouped.rejected.length})`}>
          <div className="space-y-2">
            {grouped.rejected.map((app) => (
              <div key={String(app.id)} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {String(app.first_name)} {String(app.last_name)}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {String(app.rejection_reason ?? "Nessun motivo pubblico")}
                </p>
              </div>
            ))}
            {!grouped.rejected.length ? (
              <p className="text-[12px] text-muted">Nessun rifiuto recente.</p>
            ) : null}
          </div>
        </OperationsPanel>
      </div>
    </>
  );
}
