import Link from "next/link";
import { redirect } from "next/navigation";
import { assertBrokerPortalEnabled } from "@/lib/broker-portal";
import { getOperationsIdentity } from "@/lib/operations-access";
import { getCurrentPartnerApplication } from "@/lib/partner-applications";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Stato candidatura broker | ATLAS" };

const copy: Record<
  string,
  { title: string; body: string; tone: string }
> = {
  submitted: {
    title: "In revisione",
    body: "La candidatura è stata ricevuta. Il team ATLAS la esaminerà prima di attivare il Broker Workspace.",
    tone: "text-accent",
  },
  under_review: {
    title: "In revisione",
    body: "La candidatura è in valutazione. Ti contatteremo se servono informazioni aggiuntive.",
    tone: "text-accent",
  },
  approved: {
    title: "Approvata",
    body: "Il tuo account broker è attivo. Puoi aprire il Broker Workspace.",
    tone: "text-[var(--success-text)]",
  },
  rejected: {
    title: "Rifiutata",
    body: "La candidatura non è stata approvata in questa fase. Puoi aggiornare i dati e reinviarla.",
    tone: "text-[var(--danger-text)]",
  },
  suspended: {
    title: "Sospesa",
    body: "L'accesso broker è temporaneamente sospeso. Contatta il referente ATLAS.",
    tone: "text-[var(--warning-text)]",
  },
  draft: {
    title: "Bozza",
    body: "Completa e invia la candidatura per avviare la revisione.",
    tone: "text-muted",
  },
};

export default async function PartnerStatusPage() {
  assertBrokerPortalEnabled();

  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fpartner%2Fstatus");
  if (identity.role === "broker") redirect("/broker/dashboard");
  if (identity.role === "admin") redirect("/control-center");

  const application = await getCurrentPartnerApplication();
  if (!application) redirect("/partner/apply");

  const view = copy[application.status] ?? copy.submitted;
  const reviewActive = ["under_review", "approved"].includes(application.status);
  const activationComplete = application.status === "approved";
  const applicationDate = new Intl.DateTimeFormat("it-CH", {
    dateStyle: "medium",
    timeZone: "Europe/Zurich",
  }).format(new Date(application.createdAt));

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Candidatura broker
        </p>
        <h1 className={`mt-3 text-2xl font-semibold tracking-tight ${view.tone}`}>
          {view.title}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{view.body}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-4" aria-label="Avanzamento candidatura">
          {[
            ["Account creato", true],
            ["Richiesta ricevuta", application.status !== "draft"],
            ["Verifica ATLAS", reviewActive],
            ["Attivazione Broker", activationComplete],
          ].map(([label, complete], index) => (
            <div
              key={String(label)}
              className={`rounded-xl border p-3 ${
                complete
                  ? "border-[var(--success-border)] bg-[var(--success-bg)]"
                  : "border-border bg-card-muted/40"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Step {index + 1}
              </p>
              <p className="mt-1 text-[11px] font-medium text-foreground">
                {label} {complete ? "✓" : ""}
              </p>
            </div>
          ))}
        </div>
        <dl className="mt-6 grid gap-3 rounded-xl border border-border bg-card-muted/30 p-4 text-[12px] sm:grid-cols-3">
          <div>
            <dt className="text-muted">Società</dt>
            <dd className="mt-1 font-medium">
              {application.organizationName ?? "Non indicata"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Data richiesta</dt>
            <dd className="mt-1 font-medium">{applicationDate}</dd>
          </div>
          <div>
            <dt className="text-muted">Cantone</dt>
            <dd className="mt-1 font-medium">{cantonLabel(application.primaryCanton)}</dd>
          </div>
        </dl>
        {application.status === "rejected" && application.rejectionReason ? (
          <p className="mt-4 rounded-lg bg-card-muted px-3 py-2 text-[12px] text-foreground">
            Motivazione: {application.rejectionReason}
          </p>
        ) : null}
        <p className="mt-4 text-[11px] text-muted">
          Aggiornata il{" "}
          {new Intl.DateTimeFormat("it-CH", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Zurich",
          }).format(new Date(application.updatedAt))}
          .
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {application.status === "approved" ? (
            <Link href="/broker/dashboard" className="atlas-btn-primary px-4 py-2.5 text-[13px]">
              Apri Broker Workspace
            </Link>
          ) : null}
          {["draft", "rejected"].includes(application.status) ? (
            <Link href="/partner/apply" className="atlas-btn-primary px-4 py-2.5 text-[13px]">
              Aggiorna candidatura
            </Link>
          ) : null}
          <Link href="/dashboard" className="atlas-btn-secondary px-4 py-2.5 text-[13px]">
            Torna all&apos;account ATLAS
          </Link>
        </div>
      </div>
    </div>
  );
}
