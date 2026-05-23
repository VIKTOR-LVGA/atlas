import Link from "next/link";
import { Lock, Play, Shield, Upload, UserRound } from "lucide-react";
import { LandingDashboardPreview } from "@/components/landing/LandingDashboardPreview";

export function LandingHero() {
  return (
    <section className="landing-section-tone-glow relative overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28">
      <div
        className="landing-glow-orb -left-32 top-0 h-[500px] w-[500px] opacity-80"
        style={{ background: "rgba(99, 102, 241, 0.18)" }}
      />
      <div className="landing-grid-bg pointer-events-none absolute inset-0 opacity-[0.18]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 xl:gap-14">
        {/* Copy — reference hierarchy */}
        <div className="max-w-[30rem] lg:pt-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            <span aria-hidden>🇨🇭</span>
            AI per assicurazioni svizzere
          </p>

          <h1 className="landing-hero-headline mt-7">
            <span className="block">Atlas capisce le tue</span>
            <span className="landing-gradient-text block">assicurazioni svizzere.</span>
          </h1>

          <p className="mt-5 max-w-[28rem] text-[1.05rem] leading-[1.65] text-slate-400">
            Carica i PDF delle tue polizze. Atlas estrae persone, coperture e premi,
            organizza tutto automaticamente e ti aiuta a individuare sprechi, duplicati
            e opportunità.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className="landing-btn-gradient">
              <Upload className="h-4 w-4" />
              Carica le tue polizze
            </Link>
            <a href="#how-it-works" className="landing-btn-ghost">
              <Play className="h-4 w-4" />
              Guarda come funziona
            </a>
          </div>

          <ul className="mt-9 flex flex-col gap-2.5 text-[12px] text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-7">
            <li className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-indigo-400/90" />
              Ospitato in Svizzera
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-indigo-400/90" />
              Crittografia end-to-end
            </li>
            <li className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-indigo-400/90" />
              I tuoi dati, solo tuoi
            </li>
          </ul>
        </div>

        <LandingDashboardPreview />
      </div>
    </section>
  );
}
