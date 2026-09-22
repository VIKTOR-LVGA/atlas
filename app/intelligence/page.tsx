import Link from "next/link";
import { ArrowRight, LineChart, Lock, Map, Shuffle } from "lucide-react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { getOperationsIdentity } from "@/lib/operations-access";
import { hasIntelligenceAccess } from "@/lib/intelligence-access";
import { redirect } from "next/navigation";

export const metadata = {
  title: "ATLAS Intelligence",
  description:
    "Market intelligence aggregata e privacy-safe sul campione osservato da ATLAS: switching, premi, coperture, geografia.",
};

const pillars = [
  {
    icon: Shuffle,
    title: "Switching",
    body: "Flussi aggregati da/verso compagnie, solo con coorti sufficienti.",
  },
  {
    icon: LineChart,
    title: "Premi & coperture",
    body: "Median/p25/p75 e penetrazione coperture — mai medie fuorvianti da sole.",
  },
  {
    icon: Map,
    title: "Geografia",
    body: "Cantoni con soglia privacy. Nessun dato individuale.",
  },
  {
    icon: Lock,
    title: "Privacy-first",
    body: "Niente nomi, email, polizze, documenti o preventivi grezzi per i partner Intelligence.",
  },
];

export default async function IntelligencePublicPage() {
  const identity = await getOperationsIdentity();
  if (identity.user && (await hasIntelligenceAccess())) {
    redirect("/intelligence/dashboard");
  }

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main>
        <section className="landing-section-tone-glow relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 md:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
              ATLAS Intelligence
            </p>
            <h1 className="landing-hero-headline mt-5">
              Market intelligence sul campione ATLAS
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--landing-muted)]">
              Insight aggregati su switching, premi e coperture osservati tra gli utenti
              ATLAS. Non è una rappresentazione automatica dell&apos;intero mercato
              svizzero — e non espone mai dati personali.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/intelligence/apply" className="landing-btn-gradient">
                Richiedi accesso
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?intent=intelligence"
                className="landing-btn-ghost"
              >
                Accedi
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2">
          {pillars.map((item) => (
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
