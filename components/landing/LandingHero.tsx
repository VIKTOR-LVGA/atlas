import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Sparkles } from "lucide-react";
import { AtlasHeroVisual } from "@/components/visual/AtlasHeroVisual";

export function LandingHero() {
  return (
    <section className="atlas-v2-landing-hero relative isolate overflow-hidden">
      <div className="atlas-v2-hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20 lg:min-h-[680px] lg:grid-cols-[.96fr_1.04fr] lg:gap-8 lg:pb-24 lg:pt-24">
        <div className="relative z-10 max-w-[590px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dae3ff] bg-white/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#3e5dd0] shadow-[0_4px_12px_rgba(49,87,233,.04)]">
            <span className="h-2 w-2 rounded-full bg-[#5367ff]" aria-hidden /> Le tue assicurazioni. In un unico posto.
          </p>
          <h1 className="mt-7 text-[clamp(2.85rem,5.2vw,5.4rem)] font-[770] leading-[1.06] tracking-[-.065em] text-[#14203c]">
            Più controllo.<br/><span className="atlas-gradient-heading">Meno pensieri.</span>
          </h1>
          <p className="mt-6 max-w-[510px] text-[15px] leading-[1.8] text-[#61708e] sm:text-[17px]">
            Carica le tue polizze PDF. ATLAS ti aiuta a leggere premi, coperture e scadenze, così sai cosa hai e cosa devi ancora verificare.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="atlas-v2-primary-cta inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[16px] px-6 text-[14px] font-bold text-white">
              Inizia gratis <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <a href="#how-it-works" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[16px] border border-[#dfe7fa] bg-white px-6 text-[13px] font-bold text-[#24345e] transition-colors hover:bg-[#f1f5ff]">
              Scopri come funziona
            </a>
          </div>
          <ul className="mt-9 grid max-w-[520px] grid-cols-3 gap-3 border-t border-[#e4eafb] pt-6 text-[11px] leading-snug font-semibold text-[#687795] sm:gap-5">
            <li className="flex items-start gap-2"><FileCheck2 className="h-4 w-4 shrink-0 text-[#586df7]" aria-hidden/> Documenti organizzati</li>
            <li className="flex items-start gap-2"><Sparkles className="h-4 w-4 shrink-0 text-[#586df7]" aria-hidden/> AI con verifica umana</li>
            <li className="flex items-start gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-[#586df7]" aria-hidden/> Archivio privato</li>
          </ul>
          <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-[#8590aa]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7284b7]" aria-hidden/>
            Versione pilota: l&apos;AI può sbagliare. I documenti originali restano la fonte da controllare.
          </p>
        </div>
        <AtlasHeroVisual />
      </div>
    </section>
  );
}
