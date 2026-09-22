import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays, FileCheck2, Shield, Wallet } from "lucide-react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { getOperationsIdentity } from "@/lib/operations-access";
import { redirect } from "next/navigation";

export const metadata = {
  title: "ATLAS Broker Workspace",
  description:
    "Ricevi richieste ATLAS, gestisci revisioni condivise, appuntamenti, offerte e commissioni — senza sostituire il tuo CRM.",
};

const benefits = [
  {
    icon: Briefcase,
    title: "Richieste ATLAS assegnate",
    body: "Lavori solo i lead e i clienti che ATLAS ti assegna, con condivisione esplicita delle risorse.",
  },
  {
    icon: CalendarDays,
    title: "Pratiche digitali",
    body: "Messaggi, appuntamenti, offerte strutturate e decisioni del cliente sulla singola pratica ATLAS.",
  },
  {
    icon: Wallet,
    title: "Commissioni ATLAS",
    body: "Segui la tua quota broker sulle pratiche generate tramite ATLAS. Nessuna proiezione inventata.",
  },
  {
    icon: Shield,
    title: "Accesso su approvazione",
    body: "Il Broker Workspace non è un CRM completo: è il posto dove gestisci ciò che arriva da ATLAS.",
  },
];

export default async function BrokerPublicPage() {
  const identity = await getOperationsIdentity();
  if (identity.role === "broker" && identity.broker) {
    redirect("/broker/dashboard");
  }

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main>
        <section className="landing-section-tone-glow relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
              ATLAS Broker
            </p>
            <h1 className="landing-hero-headline mt-5">Broker Workspace</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--landing-muted)]">
              Gestisci le richieste e i clienti che ATLAS ti assegna: revisioni, appuntamenti,
              offerte e contratti — non il tuo intero portafoglio personale.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/partner/apply" className="landing-btn-gradient">
                Richiedi accesso broker
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?next=%2Fbroker%2Fdashboard" className="landing-btn-ghost">
                Hai già un account? Accedi
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
          {benefits.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 text-left"
            >
              <item.icon className="h-5 w-5 text-[var(--landing-accent-bright)]" />
              <h2 className="mt-3 text-[16px] font-semibold text-[var(--landing-text)]">
                {item.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--landing-muted)]">
                {item.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
          <FileCheck2 className="mx-auto h-6 w-6 text-[var(--landing-accent-bright)]" />
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--landing-muted)]">
            Cerchi analytics di mercato aggregate per compagnie? Visita{" "}
            <Link href="/intelligence" className="text-[var(--landing-accent-bright)] underline">
              ATLAS Intelligence
            </Link>
            .
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
