import { FileText, ScanText, ShieldCheck } from "lucide-react";
import { LandingSection, LandingSectionHeader } from "@/components/landing/LandingSection";
const cards=[
 {Icon:FileText,title:"Tutti i documenti. Un solo posto.",text:"Raccogli polizze, condizioni e comunicazioni nel tuo archivio personale."},
 {Icon:ScanText,title:"Leggi meno. Capisci di più.",text:"ATLAS estrae le informazioni disponibili e ti presenta una bozza chiara da controllare."},
 {Icon:ShieldCheck,title:"La decisione resta tua.",text:"Verifica premi, persone e coperture sul PDF originale prima di confermare."},
];
export function LandingProductShowcase(){
 return <LandingSection id="product" tone="base" className="py-16 md:py-24">
   <div className="mx-auto max-w-6xl px-5 sm:px-8">
     <LandingSectionHeader eyebrow="Per la vita di tutti i giorni" title="Le assicurazioni, senza il linguaggio complicato." description="Una web app pensata per chi vuole avere tutto sotto controllo, dal telefono o dal computer."/>
     <div className="mt-10 grid gap-4 md:grid-cols-3">
       {cards.map(({Icon,title,text})=>(
         <div key={title} className="atlas-premium-tile p-6 sm:p-7">
           <span className="atlas-pill-icon"><Icon className="h-5 w-5"/></span>
           <h3 className="mt-6 text-[19px] font-bold leading-snug tracking-[-.035em] text-foreground">{title}</h3>
           <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
         </div>
       ))}
     </div>
   </div>
 </LandingSection>;
}
