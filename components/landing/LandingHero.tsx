import Link from "next/link";
import { ArrowRight, FileText, LockKeyhole, PlayCircle, ShieldCheck, Sparkles, FolderOpen } from "lucide-react";
import { AtlasHeroVisual } from "@/components/visual/AtlasHeroVisual";
export function LandingHero(){
return <section className="insura-showcase-hero relative isolate overflow-hidden rounded-b-[28px] sm:rounded-[28px]">
  <div className="insura-showcase-landscape absolute inset-0 pointer-events-none" aria-hidden="true"/>
  <div className="relative mx-auto grid min-w-0 max-w-[1360px] items-center gap-5 px-5 pb-5 pt-8 sm:px-9 sm:py-14 lg:min-h-[650px] lg:grid-cols-[.95fr_1.05fr] lg:px-12">
    <div className="relative z-10 min-w-0">
      <h1 className="max-w-[650px] text-[clamp(2.25rem,6.3vw,4.3rem)] font-extrabold leading-[1.04] tracking-[-.065em] text-[#0b1733]">Le tue assicurazioni,<span className="mt-1 block text-[#1268ff]">finalmente<br className="hidden lg:block"/> semplici.</span></h1>
      <p className="mt-5 max-w-[440px] text-[15px] leading-[1.65] text-[#3d506f] sm:text-[17px]">Carica le tue polizze, ritrovale in un unico posto e comprendi più facilmente le tue coperture.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#0966f5] px-6 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(9,102,245,.23)] transition hover:bg-[#0758d8]">Inizia gratis <ArrowRight className="h-4 w-4"/></Link>
        <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d9e3f4] bg-white/85 px-5 text-[13px] font-semibold text-[#1c2d4b]"><PlayCircle className="h-5 w-5"/> Come funziona</a>
      </div>
      <div className="insura-hero-benefits mt-8 grid max-w-[480px] grid-cols-3 gap-3">
        {[{Icon:ShieldCheck,label:"Spazio privato",sub:"I tuoi documenti"},{Icon:Sparkles,label:"Analisi assistita",sub:"Dati da verificare"},{Icon:FolderOpen,label:"Tutto insieme",sub:"Polizze organizzate"}].map(({Icon,label,sub})=><div key={label} className="min-w-0 rounded-2xl border border-white/50 bg-white/50 p-3 shadow-sm backdrop-blur-sm"><Icon className="h-5 w-5 text-[#1468f7]"/><p className="mt-2 text-[11px] font-bold leading-tight text-[#13213e]">{label}</p><p className="mt-1 text-[10px] leading-tight text-[#667690]">{sub}</p></div>)}
      </div>
    </div>
    <div className="insura-showcase-art relative min-w-0"><AtlasHeroVisual/></div>
  </div>
  <p className="relative mx-auto max-w-[1000px] px-5 pb-5 text-center text-[11px] text-[#5f7090]"><LockKeyhole className="mr-1 inline h-3 w-3"/> Anteprima illustrativa. Verifica sempre i dati estratti con la polizza originale.</p>
</section>
}