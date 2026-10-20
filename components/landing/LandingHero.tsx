import Link from "next/link";
import { ArrowRight, CalendarCheck2, FileText, LockKeyhole, Play, ShieldCheck, Sparkles, UploadCloud, ChartNoAxesColumnIncreasing } from "lucide-react";
import { AtlasHeroVisual } from "@/components/visual/AtlasHeroVisual";

const advantages=[
  {Icon:FileText,title:"Tutte le polizze in un unico posto",description:"Carica i documenti, ritrovali quando vuoi.",href:"/register",tone:"blue"},
  {Icon:Sparkles,title:"Spiegazioni finalmente semplici",description:"I termini complicati diventano comprensibili.",href:"#how-it-works",tone:"purple"},
  {Icon:CalendarCheck2,title:"Promemoria e scadenze",description:"Tieni d'occhio i rinnovi delle tue polizze.",href:"/register",tone:"mint"},
  {Icon:ChartNoAxesColumnIncreasing,title:"Una visione più chiara",description:"Premi e coperture, senza perdere il filo.",href:"#product",tone:"orange"},
] as const;

export function LandingHero() {
  return (
    <section className="atlas-ref-landing relative isolate overflow-clip">
      <div className="atlas-ref-soft-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid w-full min-w-0 max-w-[1430px] items-center gap-3 px-5 pb-4 pt-10 sm:px-8 sm:pt-16 lg:min-h-[680px] lg:grid-cols-[.95fr_1.05fr] lg:gap-2 lg:px-11 lg:pb-8 lg:pt-12">
        <div className="relative z-10 max-w-[660px] pb-3">
          <span className="inline-flex items-center rounded-full bg-[#e8eeff] px-4 py-2 text-[12px] font-semibold text-[#3658ec]">
            La tua vita, più protetta
          </span>
          <h1 className="mt-7 text-[clamp(2.95rem,5.2vw,5.25rem)] font-extrabold leading-[1.035] tracking-[-.067em] text-[#101a36]">
            Le tue assicurazioni,<br />
            <span className="atlas-ref-gradient-title">finalmente chiare.</span>
          </h1>
          <p className="mt-7 max-w-[580px] text-[15px] leading-[1.75] text-[#5a6b8b] sm:text-[18px]">
            INSURA ti aiuta a capire, gestire e tenere sotto controllo tutte le tue polizze in un unico posto, con l&apos;aiuto dell&apos;intelligenza artificiale.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className="atlas-ref-cta inline-flex min-h-[55px] items-center justify-center gap-2.5 rounded-[17px] px-7 text-[14px] font-bold text-white">
              <UploadCloud className="h-5 w-5" aria-hidden/> Inizia gratis
            </Link>
            <a href="#how-it-works" className="inline-flex min-h-[55px] items-center justify-center gap-3 rounded-[17px] border border-[#dce5f6] bg-white/85 px-6 text-[14px] font-bold text-[#1d3060] transition hover:bg-[#eff4ff]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e6edff] text-[#4265f5]"><Play className="ml-0.5 h-4 w-4" fill="currentColor"/></span>
              Scopri come funziona
            </a>
          </div>
          <div className="mt-9 grid grid-cols-3 gap-2 sm:mt-11 sm:gap-5">
            <div className="flex items-start gap-2"><span className="atlas-ref-benefit-icon"><FileText className="h-5 w-5"/></span><span><strong className="block text-[11px] text-[#1b2c57] sm:text-[12px]">Carica le polizze</strong><small className="mt-1 block text-[10px] leading-snug text-[#5f6f8c]">Documenti PDF</small></span></div>
            <div className="flex items-start gap-2"><span className="atlas-ref-benefit-icon"><Sparkles className="h-5 w-5"/></span><span><strong className="block text-[11px] text-[#1b2c57] sm:text-[12px]">Analisi con AI</strong><small className="mt-1 block text-[10px] leading-snug text-[#5f6f8c]">Dati da verificare</small></span></div>
            <div className="flex items-start gap-2"><span className="atlas-ref-benefit-icon"><ShieldCheck className="h-5 w-5"/></span><span><strong className="block text-[11px] text-[#1b2c57] sm:text-[12px]">Sempre con te</strong><small className="mt-1 block text-[10px] leading-snug text-[#5f6f8c]">Archivio privato</small></span></div>
          </div>
        </div>
        <AtlasHeroVisual/>
      </div>
      <div className="relative mx-auto w-full max-w-[1430px] px-5 pb-12 sm:px-8 lg:px-11">
        <div className="atlas-ref-feature-tray grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-4">
          {advantages.map(({Icon,title,description,href,tone})=>(
            <Link key={title} href={href} className="atlas-ref-feature-card group flex min-h-[168px] flex-col justify-between rounded-[23px] p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4567f6]">
              <span className={`atlas-ref-feature-icon atlas-ref-feature-icon-${tone}`}><Icon className="h-6 w-6" aria-hidden/></span>
              <div className="mt-5 flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-bold leading-snug tracking-[-.025em] text-[#182648]">{title}</h2>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#596981]">{description}</p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eff3fb] text-[#243b74] group-hover:bg-[#4265f3] group-hover:text-white"><ArrowRight className="h-4 w-4" aria-hidden/></span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8590a8]"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" aria-hidden/> Versione pilota: le analisi AI sono indicative e vanno confrontate con il documento originale.</p>
      </div>
    </section>
  );
}
