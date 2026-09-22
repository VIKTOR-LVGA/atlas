import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  getLatestIntelligenceApplication,
  hasIntelligenceAccess,
} from "@/lib/intelligence-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Stato candidatura | ATLAS Intelligence" };

export default async function IntelligenceApplyStatusPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?intent=intelligence&next=%2Fintelligence%2Fapply%2Fstatus");
  }

  if (await hasIntelligenceAccess()) {
    redirect("/intelligence/dashboard");
  }

  const application = await getLatestIntelligenceApplication(user.id);
  if (!application) {
    redirect("/intelligence/apply");
  }

  let isSuspended = false;
  if (application.company_id) {
    const { data: company } = await supabase
      .from("intelligence_companies")
      .select("status")
      .eq("id", application.company_id)
      .maybeSingle();
    isSuspended = company?.status === "suspended";
  }

  const isPending = ["submitted", "under_review"].includes(application.status);
  const isRejected = application.status === "rejected";
  const submittedAt = new Intl.DateTimeFormat("it-CH", {
    dateStyle: "medium",
    timeZone: "Europe/Zurich",
  }).format(new Date(application.created_at));

  const title = isSuspended
    ? "Accesso sospeso"
    : isRejected
      ? "Candidatura non approvata"
      : isPending
        ? "Richiesta ricevuta"
        : application.status === "approved"
          ? "Approvata — attivazione in corso"
          : "Stato candidatura";

  const body = isSuspended
    ? "L'accesso ATLAS Intelligence per la tua azienda è attualmente sospeso. Contatta il team ATLAS per assistenza."
    : isRejected
      ? application.rejection_reason ||
        "La richiesta non è stata approvata in questa fase. Puoi contattare ATLAS per chiarimenti."
      : isPending
        ? "Il team ATLAS verificherà i dati aziendali prima di attivare l'accesso."
        : "La candidatura risulta approvata ma l'entitlement non è ancora attivo. Contatta ATLAS se il problema persiste.";
  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
            ATLAS Intelligence
          </p>
          <h1 className="mt-3 text-[28px] font-semibold text-[var(--landing-text)]">
            {title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-muted)]">
            {body}
          </p>

          <dl className="mt-8 grid gap-3 rounded-xl border border-[var(--landing-border)] bg-black/10 p-4 text-left text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--landing-muted)]">Azienda</dt>
              <dd className="font-medium text-[var(--landing-text)]">
                {application.company_name}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--landing-muted)]">Email</dt>
              <dd className="font-medium text-[var(--landing-text)]">
                {application.work_email}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--landing-muted)]">Data richiesta</dt>
              <dd className="font-medium text-[var(--landing-text)]">{submittedAt}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--landing-muted)]">Stato</dt>
              <dd className="font-medium text-[var(--landing-text)]">
                {isSuspended
                  ? "Sospeso"
                  : isPending
                    ? "In revisione"
                    : isRejected
                      ? "Non approvata"
                      : application.status}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isRejected ? (
              <Link href="/intelligence/apply" className="landing-btn-gradient">
                Aggiorna candidatura
              </Link>
            ) : null}
            <Link href="/intelligence" className="landing-btn-ghost">
              Torna alla overview
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
