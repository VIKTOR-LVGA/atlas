import Link from "next/link";
import { reviewPartnerApplicationAction } from "@/app/control-center/actions";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
  operationsButton,
  operationsInput,
} from "@/components/operations/OperationsUi";
import { getPartnerApplicationForAdmin } from "@/lib/partner-applications";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Candidatura Partner | Control Center" };

function text(value: unknown) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export default async function PartnerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPartnerApplicationForAdmin(id);
  if (!data) {
    return (
      <OperationsHeader
        eyebrow="Partner"
        title="Candidatura non trovata"
        description="La candidatura richiesta non è disponibile."
      />
    );
  }

  const app = data.application;
  const servedCantons = Array.isArray(app.served_cantons)
    ? app.served_cantons.map(String)
    : [];
  const languages = Array.isArray(app.languages) ? app.languages.map(String) : [];

  return (
    <>
      <OperationsHeader
        eyebrow={`Candidatura · ${text(app.status)}`}
        title={`${text(app.first_name)} ${text(app.last_name)}`}
        description="Dettaglio professionale, note interne e timeline operativa. Le note interne non sono visibili al candidato."
      />

      <div className="mb-5">
        <Link href="/control-center/partners" className="text-[12px] text-accent">
          ← Torna a Partner
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Identità e attività">
          <dl className="grid gap-3 text-[12px] sm:grid-cols-2">
            <div><dt className="text-muted">Email professionale</dt><dd>{text(app.professional_email)}</dd></div>
            <div><dt className="text-muted">Telefono</dt><dd>{text(app.phone)}</dd></div>
            <div><dt className="text-muted">Società</dt><dd>{text(app.organization_name)}</dd></div>
            <div><dt className="text-muted">Ragione sociale</dt><dd>{text(app.legal_name)}</dd></div>
            <div><dt className="text-muted">Tipo Partner</dt><dd>{text(app.partner_type)}</dd></div>
            <div><dt className="text-muted">Sito web</dt><dd>{text(app.website)}</dd></div>
            <div><dt className="text-muted">ID professionale</dt><dd>{text(app.professional_id)}</dd></div>
            <div><dt className="text-muted">Account creato</dt><dd>{formatDate(data.accountCreatedAt)}</dd></div>
            <div><dt className="text-muted">Candidatura</dt><dd>{formatDate(text(app.created_at))}</dd></div>
            <div><dt className="text-muted">Ultimo aggiornamento</dt><dd>{formatDate(text(app.updated_at))}</dd></div>
          </dl>
        </OperationsPanel>

        <OperationsPanel title="Territorio e lingue">
          <dl className="grid gap-3 text-[12px]">
            <div><dt className="text-muted">Cantone principale</dt><dd>{cantonLabel(text(app.primary_canton))}</dd></div>
            <div><dt className="text-muted">Cantoni serviti</dt><dd>{servedCantons.length ? servedCantons.map(cantonLabel).join(", ") : "—"}</dd></div>
            <div><dt className="text-muted">Lingue</dt><dd>{languages.length ? languages.join(", ") : "—"}</dd></div>
            <div><dt className="text-muted">Esperienza</dt><dd className="whitespace-pre-wrap">{text(app.experience_notes)}</dd></div>
            <div><dt className="text-muted">Messaggio</dt><dd className="whitespace-pre-wrap">{text(app.message)}</dd></div>
          </dl>
        </OperationsPanel>

        <OperationsPanel title="Revisione e decisione">
          <form action={reviewPartnerApplicationAction} className="space-y-3">
            <input type="hidden" name="application_id" value={id} />
            <label className="block text-[11px] text-muted">
              Note interne
              <textarea
                name="admin_notes"
                rows={4}
                defaultValue={data.review?.admin_notes ?? ""}
                className={operationsInput}
              />
            </label>
            <label className="block text-[11px] text-muted">
              Motivazione pubblica del rifiuto
              <input name="rejection_reason" className={operationsInput} />
            </label>
            <div className="flex flex-wrap gap-2">
              {["submitted", "under_review"].includes(String(app.status)) ? (
                <>
                  <button name="decision" value="under_review" className={operationsButton}>
                    In revisione
                  </button>
                  <button name="decision" value="approve" className={operationsButton}>
                    Approva
                  </button>
                  <button name="decision" value="reject" className={operationsButton}>
                    Rifiuta
                  </button>
                </>
              ) : null}
              {app.status === "approved" ? (
                <button name="decision" value="suspend" className={operationsButton}>
                  Sospendi
                </button>
              ) : null}
              {app.status === "suspended" ? (
                <button name="decision" value="reactivate" className={operationsButton}>
                  Riattiva
                </button>
              ) : null}
            </div>
          </form>
          <p className="mt-3 text-[10px] text-muted">
            Ultima revisione: {formatDate(data.review?.reviewed_at)}
          </p>
        </OperationsPanel>

        <OperationsPanel title="Timeline">
          {!data.audit.length ? (
            <p className="text-[12px] text-muted">Nessun evento registrato.</p>
          ) : (
            <ol className="space-y-3">
              {data.audit.map((event) => (
                <li key={event.id} className="border-l-2 border-border pl-3 text-[12px]">
                  <p className="font-medium">{event.event_type}</p>
                  <p className="text-[10px] text-muted">
                    {formatDate(event.created_at)} · {event.actor_role ?? "sistema"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </OperationsPanel>
      </div>
    </>
  );
}
