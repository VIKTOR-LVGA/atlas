import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, ChevronRight, FileText, Heart, Home, Plus, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { LandingSection } from "@/components/landing/LandingSection";

const stages=[
  {number:"01",title:"Carica le tue polizze",description:"Scegli un PDF dal tuo telefono o dal computer."},
  {number:"02",title:"INSURA le analizza",description:"Prepara una bozza con i dati disponibili e segnala quelli incerti."},
  {number:"03",title:"Conferma e organizza",description:"Verifica con il documento originale prima di salvare."},
];

export function LandingHowItWorks(){
  return <LandingSection id="how-it-works" tone="lift" className="py-12 md:py-16">
    <div className="mx-auto max-w-[1330px] px-5 sm:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-9">
        <div>
          <span className="inline-flex rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-accent">Come funziona</span>
          <h2 className="mt-5 text-[clamp(2.2rem,4.1vw,3.7rem)] font-extrabold leading-[1.1] tracking-[-.055em] text-foreground">Da documento a chiarezza, in pochi passi.</h2>
          <p className="mt-5 max-w-lg text-[15px] leading-[1.75] text-muted-foreground">INSURA legge il PDF e organizza le informazioni per te. Sei sempre tu a confermare ciò che viene salvato.</p>
          <ol className="mt-8 space-y-4">
            {stages.map(({number,title,description})=>(
              <li key={number} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#e8edff] text-[13px] font-extrabold text-[#3854db]">{number}</span>
                <span><strong className="block text-[15px] font-bold text-foreground">{title}</strong><span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">{description}</span></span>
              </li>
            ))}
          </ol>
          <Link href="/register" className="atlas-ref-cta mt-9 inline-flex min-h-12 items-center gap-2 rounded-[15px] px-6 text-[13px] font-bold text-white">
            Inizia con un PDF <ArrowRight className="h-4 w-4" aria-hidden/>
          </Link>
        </div>
        <div className="atlas-ref-upload-showcase relative isolate flex min-h-[450px] items-end justify-center gap-4 overflow-hidden rounded-[34px] border border-[#e0e9ff] px-4 pt-8 sm:gap-6 sm:px-9" aria-label="Anteprima illustrativa delle schermate mobile di INSURA" role="img">
          <div className="atlas-ref-upload-glow absolute inset-0" aria-hidden/>
          <div className="atlas-ref-upload-device relative z-10 mb-[-22px] hidden rotate-[-5deg] sm:block">
            <div className="atlas-ref-upload-device-inner">
              <div className="atlas-ref-upload-island"/>
              <div className="pt-4 text-[10px] font-semibold text-[#25365d]">9:41</div>
              <div className="mt-6 flex items-center justify-between text-[12px] font-extrabold tracking-[.18em] text-[#263f91]">INSURA <Bell className="h-4 w-4"/></div>
              <h3 className="mt-8 text-[23px] font-extrabold tracking-[-.05em] text-[#162348]">Ciao Martina 👋</h3>
              <p className="mt-1 text-[11px] text-[#7b89a5]">Le tue polizze, tutte insieme.</p>
              <div className="mt-5 grid grid-cols-3 gap-1.5">
                {[{v:"3",l:"Polizze"},{v:"CHF",l:"Premi"},{v:"2",l:"Scadenze"}].map(i=><div key={i.l} className="rounded-xl bg-[#f1f4ff] px-2 py-3"><strong className="block text-[14px] text-[#1b2c58]">{i.v}</strong><small className="text-[8px] text-[#5d6d88]">{i.l}</small></div>)}
              </div>
              <p className="mt-7 text-[13px] font-bold text-[#1c2e57]">Le tue polizze</p>
              <div className="mt-3 space-y-2.5">
                {[{Icon:Home,label:"Casa"},{Icon:Heart,label:"Salute"},{Icon:ShieldCheck,label:"Responsabilità civile"}].map(({Icon,label})=><div key={label} className="flex items-center gap-2 rounded-xl border border-[#e8edfa] px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ebefff] text-[#4b61e9]"><Icon className="h-4 w-4"/></span><span className="flex-1 text-[11px] font-semibold text-[#24385d]">{label}</span><ChevronRight className="h-3.5 w-3.5 text-[#8392b7]"/></div>)}
              </div>
              <div className="absolute bottom-6 left-5 right-5 flex justify-around border-t border-[#e8eeff] pt-3 text-[#5571ec]"><Home className="h-5 w-5"/><FileText className="h-5 w-5"/><Plus className="h-5 w-5"/><Sparkles className="h-5 w-5"/></div>
            </div>
          </div>
          <div className="atlas-ref-upload-device atlas-ref-upload-device-front relative z-20 mb-[-6px]">
            <div className="atlas-ref-upload-device-inner">
              <div className="atlas-ref-upload-island"/>
              <div className="pt-4 text-[10px] font-semibold text-[#25365d]">9:41</div>
              <div className="mt-7 flex items-center justify-center text-[12px] font-bold text-[#1c2f55]">Carica una polizza</div>
              <div className="mt-5 flex items-center justify-center gap-3">{[1,2,3].map(i=><span key={i} className={`h-2 w-2 rounded-full ${i===1?"bg-[#5065f5]":"bg-[#e1e7f7]"}`}/>)}</div>
              <h3 className="mt-8 text-center text-[21px] font-extrabold tracking-[-.045em] text-[#152548]">Carica il tuo PDF</h3>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-[#7a88a7]">INSURA prepara una bozza<br/>da verificare.</p>
              <div className="mt-6 flex h-[185px] flex-col items-center justify-center rounded-[21px] border-2 border-dashed border-[#cbd9ff] bg-[#f8faff]">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-[22px] bg-[#e7edff] text-[#4968f6]"><UploadCloud className="h-8 w-8"/></span>
                <strong className="mt-4 text-[12px] text-[#27385e]">Seleziona un documento</strong>
                <small className="mt-2 text-[9px] text-[#62708a]">PDF · massimo 10 MB</small>
              </div>
              <div className="mt-5 rounded-[15px] bg-[#f3f5fe] px-4 py-3">
                {[{Icon:FileText,t:"Il PDF originale"},{Icon:Sparkles,t:"La bozza AI"},{Icon:CheckCircle2,t:"La tua conferma"}].map(({Icon,t})=><div key={t} className="flex items-center gap-2 py-1.5 text-[10px] text-[#536482]"><Icon className="h-4 w-4 text-[#556bec]"/>{t}</div>)}
              </div>
              <div className="mt-5 flex min-h-10 items-center justify-center rounded-[14px] bg-[#4161f5] text-[12px] font-bold text-white">Continua</div>
            </div>
          </div>
          <span className="absolute bottom-3 left-4 z-30 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold text-[#637399] backdrop-blur">Schermate illustrative</span>
        </div>
      </div>
    </div>
  </LandingSection>;
}
