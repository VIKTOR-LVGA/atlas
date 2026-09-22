import { redirect } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { getOperationsIdentity } from "@/lib/operations-access";
import { hasIntelligenceAccess } from "@/lib/intelligence-access";
import { submitIntelligenceApplicationAction } from "@/app/intelligence/actions";
import { operationsInput } from "@/components/operations/OperationsUi";

export const metadata = { title: "Richiedi accesso | ATLAS Intelligence" };

export default async function IntelligenceApplyPage() {
  const identity = await getOperationsIdentity();
  if (!identity.user) {
    redirect("/login?next=%2Fintelligence%2Fapply");
  }
  if (await hasIntelligenceAccess()) {
    redirect("/intelligence/dashboard");
  }

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
          ATLAS Intelligence
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-[var(--landing-text)]">
          Richiedi accesso
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-muted)]">
          Accesso riservato a compagnie e partner B2B. Nessuna approvazione automatica.
          Non riceverai mai dati personali di consumatori.
        </p>

        <form action={submitIntelligenceApplicationAction} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[12px]">
              Nome
              <input name="first_name" required className={`${operationsInput} mt-1`} />
            </label>
            <label className="block text-[12px]">
              Cognome
              <input name="last_name" required className={`${operationsInput} mt-1`} />
            </label>
          </div>
          <label className="block text-[12px]">
            Email professionale
            <input
              name="work_email"
              type="email"
              required
              defaultValue={identity.user.email ?? ""}
              className={`${operationsInput} mt-1`}
            />
          </label>
          <label className="block text-[12px]">
            Società
            <input name="company_name" required className={`${operationsInput} mt-1`} />
          </label>
          <label className="block text-[12px]">
            Ragione sociale
            <input name="legal_entity" className={`${operationsInput} mt-1`} />
          </label>
          <label className="block text-[12px]">
            Ruolo / titolo
            <input name="job_title" className={`${operationsInput} mt-1`} />
          </label>
          <label className="block text-[12px]">
            Tipo compagnia
            <select name="company_type" className={`${operationsInput} mt-1`} defaultValue="insurer">
              <option value="insurer">Compagnia assicurativa</option>
              <option value="general_agency">Agenzia generale</option>
              <option value="insurance_group">Gruppo assicurativo</option>
              <option value="market_partner">Partner di mercato</option>
              <option value="other">Altro</option>
            </select>
          </label>
          <label className="block text-[12px]">
            Sito
            <input name="website" className={`${operationsInput} mt-1`} />
          </label>
          <label className="block text-[12px]">
            Motivo della richiesta
            <textarea
              name="access_reason"
              required
              rows={4}
              className={`${operationsInput} mt-1`}
            />
          </label>
          <label className="flex items-start gap-2 text-[12px] text-[var(--landing-muted)]">
            <input type="checkbox" name="consent" required className="mt-1" />
            Acconsento al trattamento dei dati per la valutazione della candidatura
            Intelligence. Nessun accesso automatico ai dati consumer.
          </label>
          <button type="submit" className="landing-btn-gradient">
            Invia candidatura
          </button>
        </form>
      </main>
      <LandingFooter />
    </div>
  );
}
