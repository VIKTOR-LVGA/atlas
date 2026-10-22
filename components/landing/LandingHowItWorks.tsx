import Link from "next/link";
import { AtlasBrandMark } from "@/components/brand/AtlasBrandMark";
import { ArrowRight, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { LandingSection } from "@/components/landing/LandingSection";
import { LandingDashboardPreview } from "@/components/landing/LandingDashboardPreview";

const steps = [
  {Icon:FileText,number:"01",title:"Carica",detail:"Aggiungi il PDF della tua polizza."},
  {Icon:Sparkles,number:"02",title:"Analizza",detail:"INSURA prepara una scheda con i dati disponibili."},
  {Icon:CheckCircle2,number:"03",title:"Conferma",detail:"Controlla e correggi prima di salvare."},
];

export function LandingHowItWorks() {
  return <LandingSection id="how-it-works" tone="base" className="py-14 md:py-20">
    <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
      <div className="mx-auto max-w-[650px] text-center"><AtlasBrandMark className="mx-auto mb-2 h-16 w-16" />
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#3157eb]">Come funziona</p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-extrabold tracking-[-.055em] text-[#121a29]">Tre passi. Tutto più chiaro.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[#56647b]">Dal PDF a un archivio ordinato, sempre con la tua conferma.</p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {steps.map(({Icon,number,title,detail})=><div key={number} className="rounded-[20px] border border-[#e5eaf3] bg-white p-5 shadow-[0_5px_22px_rgba(18,26,41,0.035)]">
          <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eef2ff] text-[#3157eb]"><Icon className="h-5 w-5"/></span><span className="text-[12px] font-bold text-[#8490a4]">{number}</span></div>
          <h3 className="mt-4 text-[17px] font-extrabold text-[#121a29]">{title}</h3><p className="mt-1 text-[13px] leading-relaxed text-[#56647b]">{detail}</p>
        </div>)}
      </div>
      <div className="mt-12 grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
        <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#3157eb]">Dentro INSURA</p><h2 className="mt-3 text-[clamp(2rem,3.8vw,3.1rem)] font-extrabold leading-tight tracking-[-.05em] text-[#121a29]">Le tue polizze, a colpo d'occhio.</h2><p className="mt-4 max-w-[450px] text-[15px] leading-relaxed text-[#56647b]">Una dashboard semplice per trovare le assicurazioni, visualizzare le informazioni confermate e tenere d'occhio le scadenze.</p><Link href="/register" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[15px] bg-[#3157eb] px-6 text-[13px] font-bold text-white">Inizia gratis <ArrowRight className="h-4 w-4"/></Link></div>
        <LandingDashboardPreview/>
      </div>
    </div>
  </LandingSection>;
}
