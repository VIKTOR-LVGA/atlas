import Link from "next/link";
import { ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";

export function AtlasAlpineHero({greeting,name,empty=false}:{
  greeting:string;name:string;empty?:boolean;
}){
  return <header className="atlas-ref-alpine-hero relative isolate min-h-[245px] overflow-hidden rounded-[23px] px-6 py-8 sm:px-9 sm:py-9 lg:min-h-[286px] lg:px-10 lg:py-11">
    <div className="atlas-ref-alpine-shade absolute inset-0" aria-hidden/>
    <div className="relative z-10 max-w-[500px]">
      <p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#3e61d6]">Benvenuto in INSURA</p>
      <h1 className="mt-4 text-[clamp(2rem,3.3vw,3rem)] font-extrabold leading-[1.11] tracking-[-.06em] text-[#0c1d49]">
        {empty?"Le tue assicurazioni,":"Le tue sicurezze,"}<br/> {empty?"più semplici.":"sempre con te."}
      </h1>
      <p className="mt-4 max-w-[340px] text-[13px] leading-[1.65] text-[#4a608a] sm:text-[14px]">
        {empty?`${greeting}, ${name}. Aggiungi una polizza per iniziare a organizzare il tuo portafoglio.`:`${greeting}, ${name}. Le tue polizze e i documenti, in un unico posto.`}
      </p>
      <Link href={empty?"/documents":"/policies"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0e1f54] px-5 text-[12px] font-bold text-white shadow-[0_9px_18px_rgba(6,21,59,.14)] hover:bg-[#233c7e]">
        {empty?<FilePlus2 className="h-4 w-4"/>:null}
        {empty?"Carica la tua prima polizza":"Visualizza le mie polizze"} <ArrowRight className="h-4 w-4"/>
      </Link>
    </div>
    <div className="absolute bottom-[19%] right-[6%] hidden items-center gap-2 rounded-[15px] border border-white/60 bg-white/75 px-3 py-2.5 shadow-[0_11px_26px_rgba(20,58,116,.09)] backdrop-blur-lg xl:flex" aria-hidden>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ebefff] text-[#4667e9]"><ShieldCheck className="h-4 w-4"/></span>
      <span className="text-[10px] font-semibold leading-snug text-[#465d90]">Proteggi ciò che<br/>conta per te</span>
    </div>
  </header>;
}
