import { redirect } from "next/navigation";
import { PartnerApplyForm } from "@/components/partner/PartnerApplyForm";
import { getOperationsIdentity } from "@/lib/operations-access";
import { getCurrentPartnerApplication } from "@/lib/partner-applications";
import { SWISS_CANTON_CODES, CANTON_LABELS } from "@/lib/swiss-cantons";

export const metadata = { title: "Candidatura partner | ATLAS" };

export default async function PartnerApplyPage() {
  const identity = await getOperationsIdentity();
  if (!identity.user) {
    redirect("/login?next=%2Fpartner%2Fapply");
  }
  if (identity.role === "broker") redirect("/partner/dashboard");
  if (identity.role === "admin") redirect("/control-center");

  const existing = await getCurrentPartnerApplication();
  if (existing && !["draft", "rejected"].includes(existing.status)) {
    redirect("/partner/status");
  }

  const cantonOptions = SWISS_CANTON_CODES.map((code) => ({
    value: code,
    label: CANTON_LABELS[code],
  }));

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Candidatura partner
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Richiedi l&apos;accesso al Partner Portal
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Compila i dati professionali. La candidatura viene esaminata da ATLAS: non viene
          approvata automaticamente.
        </p>
        {existing?.status === "rejected" ? (
          <p className="mt-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2 text-[12px] text-[var(--warning-text)]">
            La candidatura precedente è stata rifiutata
            {existing.rejectionReason ? `: ${existing.rejectionReason}` : "."} Puoi
            aggiornare i dati e reinviarla.
          </p>
        ) : null}
        <div className="mt-8">
          <PartnerApplyForm
            cantonOptions={cantonOptions}
            defaults={
              existing
                ? {
                    firstName: existing.firstName,
                    lastName: existing.lastName,
                    organizationName: existing.organizationName ?? "",
                    professionalEmail: existing.professionalEmail,
                    primaryCanton: existing.primaryCanton,
                    servedCantons: existing.servedCantons,
                    languages: existing.languages,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
