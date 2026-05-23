import { Eye, Lock, Server, ShieldCheck } from "lucide-react";
import {
  LandingSection,
  LandingSectionHeader,
} from "@/components/landing/LandingSection";

const pillars = [
  {
    icon: Lock,
    title: "Sicuro per design",
    description:
      "Crittografia e architettura pensata per documenti assicurativi sensibili.",
  },
  {
    icon: ShieldCheck,
    title: "Zero accessi non autorizzati",
    description: "Solo tu accedi ai tuoi PDF e alle schede polizza del tuo account.",
  },
  {
    icon: Server,
    title: "Ospitato in Svizzera",
    description: "Dati trattati con standard elevati e conformità nLPD.",
  },
  {
    icon: Eye,
    title: "Trasparente",
    description:
      "Nessuna vendita di polizze. Nessun broker. Solo analisi indipendente.",
  },
];

export function LandingTrust() {
  return (
    <LandingSection id="security" tone="lift" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        <div className="relative flex justify-center lg:justify-start">
          <div
            className="landing-glow-orb left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
            style={{ background: "rgba(99, 102, 241, 0.2)" }}
          />
          <div className="landing-glass-strong relative flex h-72 w-72 items-center justify-center rounded-3xl sm:h-80 sm:w-80">
            <div
              className="absolute inset-4 rounded-2xl opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)
                `,
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative text-center">
              <span className="text-5xl drop-shadow-lg" aria-hidden>
                🇨🇭
              </span>
              <p className="mt-4 text-sm font-semibold text-white">Privacy svizzera</p>
              <p className="mt-1 text-xs text-slate-500">nLPD · GDPR</p>
              <div className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/15">
                <ShieldCheck className="h-5 w-5 text-indigo-300" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <LandingSectionHeader
            eyebrow="Fiducia"
            title="I tuoi dati. Al sicuro. In Svizzera."
            description="Atlas non è un intermediario assicurativo. Non ti contatteranno compagnie per venderti polizze. Il prodotto serve solo a darti chiarezza."
          />

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="landing-glass rounded-xl p-4 transition hover:border-white/12"
              >
                <pillar.icon className="h-5 w-5 text-indigo-400" />
                <p className="mt-3 font-medium text-white">{pillar.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
