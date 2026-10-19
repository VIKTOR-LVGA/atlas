import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingSection } from "@/components/landing/LandingSection";
export function LandingFinalCta() {
 return <LandingSection tone="base" className="border-t-0 py-12 md:py-20">
  <div className="mx-auto max-w-6xl px-5 sm:px-8">
   <div className="relative overflow-hidden rounded-[30px] bg-[#19305a] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
    <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#5379f2]/30 blur-3xl" aria-hidden/>
    <div className="relative">
     <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/60">Inizia con una polizza</p>
     <h2 className="mx-auto mt-4 max-w-xl text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-.045em]">La tua vita assicurativa, finalmente semplice.</h2>
     <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-white/70">Crea il tuo spazio, aggiungi un documento e scopri cosa sai già delle tue coperture.</p>
     <Link href="/register" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-white px-6 text-[13px] font-bold text-[#19305a] hover:bg-white/90">Inizia gratis <ArrowRight className="h-4 w-4"/></Link>
     <p className="mt-5 text-[11px] text-white/60">In fase pilota · nessuna carta di credito richiesta</p>
    </div>
   </div>
  </div>
 </LandingSection>;
}
