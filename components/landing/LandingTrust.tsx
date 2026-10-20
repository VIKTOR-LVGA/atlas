import { Eye, FileCheck2, LockKeyhole } from "lucide-react";
import { LandingSection, LandingSectionHeader } from "@/components/landing/LandingSection";
const pillars=[
 {Icon:LockKeyhole,title:"Uno spazio privato",body:"Le polizze e i documenti sono associati al tuo account, con controlli di accesso."},
 {Icon:FileCheck2,title:"Dati da verificare",body:"L'AI può sbagliare o non leggere tutto: INSURA ti chiede di controllare il PDF originale."},
 {Icon:Eye,title:"Solo quello che sappiamo",body:"Quando un valore manca o è ambiguo, viene segnalato. Non inventiamo premi o coperture."},
];
export function LandingTrust(){
 return <LandingSection id="security" tone="base" className="py-16 md:py-24">
  <div className="mx-auto max-w-6xl px-5 sm:px-8">
   <LandingSectionHeader eyebrow="Trasparenza" title="La fiducia nasce dalla chiarezza." description="Le polizze sono documenti importanti. INSURA ti aiuta a comprenderli, senza sostituirli."/>
   <div className="mt-10 grid gap-4 md:grid-cols-3">
    {pillars.map(({Icon,title,body})=><div key={title} className="atlas-premium-tile p-6 sm:p-7">
     <span className="atlas-pill-icon"><Icon className="h-5 w-5"/></span>
     <h3 className="mt-5 text-[17px] font-bold tracking-tight text-foreground">{title}</h3>
     <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
    </div>)}
   </div>
  </div>
 </LandingSection>;
}
