import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { LandingSection } from "@/components/landing/LandingSection";

export function LandingFinalCta() {
  return (
    <LandingSection tone="base" className="border-t-0 py-12 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="atlas-v2-final-cta relative isolate overflow-hidden rounded-[32px] px-6 py-11 sm:px-10 sm:py-14 lg:px-16">
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_.65fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#5367d5]">Il tuo spazio, da oggi</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(2.05rem,4.5vw,3.9rem)] font-bold leading-[1.1] tracking-[-.055em] text-[#172544]">
                Tutte le tue polizze.<br/><span className="atlas-gradient-heading">Finalmente insieme.</span>
              </h2>
              <p className="mt-5 max-w-[460px] text-[14px] leading-[1.75] text-[#61708d] sm:text-[16px]">
                Inizia con un documento. ATLAS ti aiuta a metterlo in ordine e a capire quali informazioni sono da verificare.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href="/register" className="atlas-v2-primary-cta inline-flex min-h-12 items-center gap-2 rounded-[14px] px-6 text-[13px] font-bold text-white">Inizia gratis <ArrowRight className="h-4 w-4"/></Link>
                <Link href="/login" className="text-[13px] font-semibold text-[#40557e] hover:underline">Hai già un account? Accedi</Link>
              </div>
              <p className="mt-5 text-[11px] text-[#8391a9]">Progetto pilota gratuito · Nessuna carta di credito</p>
            </div>
            <div className="atlas-v2-cta-art relative mx-auto w-full max-w-[330px]" aria-hidden="true">
              <div className="absolute -right-1 top-0 rotate-12 rounded-[22px] border border-[#dce5fb] bg-white/85 p-5 shadow-[0_15px_40px_rgba(46,74,130,.10)]">
                <span className="flex items-center gap-2 text-[11px] font-bold text-[#24355e]"><FileText className="h-4 w-4 text-[#4d64ee]"/> Documento PDF</span>
                <div className="mt-4 h-2 w-32 rounded-full bg-[#e9eef9]"/><div className="mt-2 h-2 w-24 rounded-full bg-[#e9eef9]"/>
              </div>
              <div className="absolute bottom-4 left-0 -rotate-6 rounded-[25px] border border-[#d7e1ff] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(46,74,130,.14)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e7edff] text-[#4c60ea]"><Sparkles className="h-6 w-6"/></span>
                <p className="mt-3 text-[13px] font-bold text-[#172544]">ATLAS AI</p>
                <p className="mt-1 text-[11px] text-[#5f6f8c]">Una bozza da controllare</p>
              </div>
              <div className="absolute bottom-0 right-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#e0f7ee] text-[#29a37b] shadow-sm"><CheckCircle2 className="h-6 w-6"/></div>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
