import { Eye, Lock, Server, ShieldCheck } from "lucide-react";
import { LandingTrustVisual } from "@/components/landing/LandingTrustVisual";
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
          <LandingTrustVisual />
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
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
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
