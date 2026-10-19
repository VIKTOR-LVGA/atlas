import { ArrowRight, CheckCheck, FileUp, ScanSearch } from "lucide-react";
import { LandingSection, LandingSectionHeader } from "@/components/landing/LandingSection";
const steps=[
 {Icon:FileUp,title:"Carica il PDF",text:"Scegli il documento assicurativo dal tuo telefono o dal computer."},
 {Icon:ScanSearch,title:"Leggi la bozza AI",text:"ATLAS identifica i dati che riesce a trovare e segnala quelli incerti."},
 {Icon:CheckCheck,title:"Verifica e organizza",text:"Controlla il PDF originale e conferma ciò che vuoi salvare."}
];
export function LandingHowItWorks(){
 return <LandingSection id="how-it-works" tone="lift" className="py-16 md:py-24">
  <div className="mx-auto max-w-6xl px-5 sm:px-8">
   <LandingSectionHeader eyebrow="Come funziona" title="Tre passi. Tutto più chiaro." description="Non devi conoscere il linguaggio assicurativo per cominciare." align="center"/>
   <ol className="mt-10 grid gap-4 md:grid-cols-3">
    {steps.map(({Icon,title,text},i)=>(
     <li key={title} className="atlas-premium-tile p-6 sm:p-7">
      <span className="flex items-center justify-between"><span className="atlas-pill-icon"><Icon className="h-5 w-5"/></span><span className="text-[13px] font-bold text-muted">0{i+1}</span></span>
      <h3 className="mt-5 text-[19px] font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
      {i<2?<ArrowRight className="mt-5 h-4 w-4 text-accent" aria-hidden/>:null}
     </li>
    ))}
   </ol>
  </div>
 </LandingSection>;
}
