import Link from "next/link";
import { redirect } from "next/navigation";
import { getOperationsIdentity } from "@/lib/operations-access";
import { getCurrentPartnerApplication } from "@/lib/partner-applications";

export const metadata = { title: "Stato candidatura | ATLAS" };

const copy: Record<
  string,
  { title: string; body: string; tone: string }
> = {
  submitted: {
    title: "In revisione",
    body: "La candidatura è stata ricevuta. Il team ATLAS la esaminerà prima di attivare l'accesso partner.",
    tone: "text-accent",
  },
  under_review: {
    title: "In revisione",
    body: "La candidatura è in valutazione. Ti contatteremo se servono informazioni aggiuntive.",
    tone: "text-accent",
  },
  approved: {
    title: "Approvata",
    body: "Il tuo profilo partner è attivo. Puoi aprire il Partner Portal.",
    tone: "text-[var(--success-text)]",
  },
  rejected: {
    title: "Rifiutata",
    body: "La candidatura non è stata approvata in questa fase. Puoi aggiornare i dati e reinviarla.",
    tone: "text-[var(--danger-text)]",
  },
  suspended: {
    title: "Sospesa",
    body: "L'accesso partner è temporaneamente sospeso. Contatta il referente ATLAS.",
    tone: "text-[var(--warning-text)]",
  },
  draft: {
    title: "Bozza",
    body: "Completa e invia la candidatura per avviare la revisione.",
    tone: "text-muted",
  },
};

export default async function PartnerStatusPage() {
  const identity = await getOperationsIdentity();
  if (!identity.user) redirect("/login?next=%2Fpartner%2Fstatus");
  if (identity.role === "broker") redirect("/partner/dashboard");
  if (identity.role === "admin") redirect("/control-center");

  const application = await getCurrentPartnerApplication();
  if (!application) redirect("/partner/apply");

  const view = copy[application.status] ?? copy.submitted;

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Candidatura partner
        </p>
        <h1 className={`mt-3 text-2xl font-semibold tracking-tight ${view.tone}`}>
          {view.title}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{view.body}</p>
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
            <Link href="/partner/dashboard" className="atlas-btn-primary px-4 py-2.5 text-[13px]">
              Apri Partner Portal
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
