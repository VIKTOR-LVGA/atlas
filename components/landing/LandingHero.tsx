import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Sparkles } from "lucide-react";
import { LandingDashboardPreview } from "@/components/landing/LandingDashboardPreview";

export function LandingHero(){
  return (
    <section className="relative overflow-hidden bg-[var(--landing-bg)] pb-20 pt-14 sm:pt-20 lg:pb-28 lg:pt-28">
      <div className="pointer-events-none absolute -right-52 -top-60 h-[500px] w-[500px] rounded-full bg-[color-mix(in_srgb,var(--landing-accent)_7%,transparent)] blur-[90px]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.94fr_1.06fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 py-2 text-[11px] font-bold tracking-[.03em] text-[var(--landing-muted)]">
            <span aria-hidden>🇨🇭</span> LA TUA ASSICURAZIONE. PIÙ SEMPLICE.
          </p>
          <h1 className="atlas-marketing-headline mt-7">
            Meno carte.<br/>Più <span className="text-[var(--landing-accent)]">chiarezza.</span>
          </h1>
          <p className="atlas-marketing-lead mt-6 max-w-[33rem]">
            Tutte le polizze, i premi e le scadenze in un unico posto. Carica i tuoi PDF,
            controlla i dati e fai domande quando qualcosa non ti è chiaro.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="landing-btn-primary min-h-14 justify-center !px-7 !text-[14px] !font-bold">
              Crea il tuo account <ArrowRight className="h-4 w-4"/>
            </Link>
            <a href="#how-it-works" className="landing-btn-ghost min-h-14 justify-center !px-6 !text-[14px]">
              Scopri come funziona
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] font-medium text-[var(--landing-muted)]">
            <span className="inline-flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[var(--landing-accent)]"/> Polizze organizzate</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--landing-accent)]"/> AI con verifica umana</span>
            <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[var(--landing-accent)]"/> Archivio privato</span>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-[11px] leading-relaxed text-[var(--landing-muted)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--landing-accent)]"/>
            Progetto pilota gratuito: le analisi non sostituiscono la polizza originale.
          </p>
        </div>
        <LandingDashboardPreview/>
      </div>
    </section>
  );
}
