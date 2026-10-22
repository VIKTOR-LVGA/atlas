import Link from "next/link";
import { FileText, LockKeyhole, Play, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { AtlasHeroVisual } from "@/components/visual/AtlasHeroVisual";

export function LandingHero() {
  return (
    <section className="atlas-ref-landing relative isolate overflow-clip">
      <div className="atlas-ref-soft-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid w-full min-w-0 max-w-[1430px] items-center gap-1 px-5 pb-1 pt-5 sm:gap-3 sm:px-8 sm:pb-4 sm:pt-16 lg:min-h-[680px] lg:grid-cols-[.95fr_1.05fr] lg:gap-2 lg:px-11 lg:pb-8 lg:pt-12">
        <div className="relative z-10 max-w-[660px] pb-0 sm:pb-3">
          <span className="inline-flex items-center rounded-full bg-[#e8eeff] px-3 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-[12px] font-semibold text-[#3658ec]">
            La tua vita, più protetta
          </span>
          <h1 className="mt-3 min-w-0 break-words text-[clamp(1.95rem,7.4vw,2.55rem)] sm:mt-7 sm:text-[clamp(2.95rem,5.2vw,5.25rem)] font-extrabold leading-[1.035] tracking-[-.067em] text-[#101a36]">
            Le tue assicurazioni,<br className="hidden sm:block" />
            <span className="atlas-ref-gradient-title">finalmente chiare.</span>
          </h1>
          <p className="mt-3 max-w-[580px] text-[13px] leading-[1.45] sm:mt-7 sm:text-[15px] sm:leading-[1.75] text-[#5a6b8b] sm:text-[18px]">
            Carica le tue polizze, ritrovale quando vuoi e comprendi meglio le coperture. Tutto in un unico spazio gratuito.
          </p>
          <div className="mt-4 flex flex-row items-center gap-3 sm:mt-9 sm:items-center">
            <Link href="/register" className="atlas-ref-cta inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[13px] px-4 text-[13px] sm:min-h-[55px] sm:flex-none sm:rounded-[17px] sm:px-7 sm:text-[14px] font-bold text-white">
              <UploadCloud className="h-5 w-5" aria-hidden/> Inizia gratis
            </Link>
            <a href="#how-it-works" className="hidden min-h-[55px] items-center justify-center gap-3 rounded-[17px] border sm:inline-flex border-[#dce5f6] bg-white/85 px-6 text-[14px] font-bold text-[#1d3060] transition hover:bg-[#eff4ff]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6edff] text-[#4265f5]"><Play className="ml-0.5 h-4 w-4" fill="currentColor"/></span>
              Scopri come funziona
            </a>
          </div>
          <div className="mt-4 hidden grid-cols-3 gap-2 sm:mt-11 sm:grid sm:gap-5">
            {[
              { Icon: FileText, title: "Carica le polizze" },
              { Icon: Sparkles, title: "Analisi con AI" },
              { Icon: ShieldCheck, title: "Sempre con te" },
            ].map(({ Icon, title }) => (
              <div key={title} className="flex min-w-0 flex-col items-center justify-start gap-2 text-center sm:gap-3">
                <span className="atlas-ref-benefit-icon"><Icon className="h-5 w-5" aria-hidden /></span>
                <strong className="text-[11px] font-bold leading-tight text-[#1b2c57] sm:text-[13px]">{title}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="atlas-ref-hero-art-wrap"><AtlasHeroVisual/></div>
      </div>
      <p className="mx-auto max-w-[1000px] px-5 pb-8 text-center text-[11px] text-[#687792]"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" aria-hidden /> Le analisi AI sono di supporto: verifica sempre i dati con il documento originale.</p>
    </section>
  );
}
