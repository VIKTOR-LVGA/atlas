import Link from "next/link";
import { ArrowRight, Briefcase, FileCheck2, LineChart, Shield } from "lucide-react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export const metadata = {
  title: "Diventa partner ATLAS",
  description:
    "Richiedi l'accesso al Partner Portal ATLAS: pipeline, documenti condivisi, offerte, contratti e commissioni.",
};

const benefits = [
  {
    icon: Briefcase,
    title: "Richieste dalla piattaforma",
    body: "Ricevi consulenze generate da utenti ATLAS che scelgono esplicitamente cosa condividere.",
  },
  {
    icon: FileCheck2,
    title: "Pipeline digitale",
    body: "Contatti, appuntamenti, offerte e contratti in un unico workspace operativo.",
  },
  {
    icon: LineChart,
    title: "Commissioni e analytics",
    body: "Segui la tua quota, i rinnovi e le performance per categoria e cantone — senza dati inventati.",
  },
  {
    icon: Shield,
    title: "Accesso controllato",
    body: "L'accesso partner è su approvazione ATLAS. Nessuna auto-promozione e nessun lead senza mandato.",
  },
];

export default function PartnerLandingPage() {
  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main>
        <section className="landing-section-tone-glow relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
              Partner ATLAS
            </p>
            <h1 className="landing-hero-headline mt-5">
              Diventa partner ATLAS
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--landing-muted)]">
              Gestisci clienti digitali, documenti condivisi in modo esplicito, offerte e
              contratti — con tracciamento delle commissioni e analytics sul tuo portafoglio.
              Non promettiamo volumi di lead né guadagni.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/partner/apply" className="landing-btn-gradient">
                Richiedi accesso
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?next=%2Fpartner%2Fapply" className="landing-btn-ghost">
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
      </main>
      <LandingFooter />
    </div>
  );
}
