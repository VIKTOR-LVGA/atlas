import Link from "next/link";
import { ArrowRight, CarFront, CheckCircle2, CircleHelp, FileText, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUserPolicies } from "@/lib/policies";
import type { UserPolicy } from "@/lib/types";

export const metadata={title:"Confronto mercato | INSURA"};
const annualFactor:Record<string,number>={monthly:12,quarterly:4,semiannual:2,annual:1};
function annualPremium(p:UserPolicy){return !p.requiresReview&&p.premiumAmount!==null&&Number.isFinite(p.premiumAmount)?p.premiumAmount*(annualFactor[p.premiumFrequency]??0):null;}
function money(value:number,currency:string){return new Intl.NumberFormat("it-CH",{style:"currency",currency,maximumFractionDigits:0}).format(value);}
export default async function MarketPage(){
 const policies=await getCurrentUserPolicies();
 const autos=policies.filter(p=>p.policyType==="car"||/auto|veicol|motor/i.test([p.policyType,p.policyCategoryLabel].join(" ")));
 const candidates=autos.length?autos:policies;
 return <PageShell>
  <PageHeader title="Confronta le tue assicurazioni" description="Partiamo dalle polizze che hai già: scopri cosa confrontare prima di scegliere un'altra offerta."/>
  <div className="rounded-[20px] border border-[#dce5ff] bg-[#f1f5ff] px-5 py-4 text-[13px] leading-6 text-[#33476e]"><strong className="text-[#142449]">Nessun prezzo inventato.</strong> I premi qui sotto provengono dalle tue polizze confermate. Per confrontarli con altre compagnie serviranno preventivi reali, con garanzie equivalenti.</div>
  {candidates.length===0?<section className="rounded-[24px] border border-[#e4eaf4] bg-white p-6"><h2 className="text-lg font-bold">Iniziamo dalla tua prima polizza</h2><p className="mt-2 text-sm text-[#66758e]">Carica una polizza o aggiungila manualmente per preparare il confronto.</p><Link className="mt-4 inline-flex items-center gap-2 font-semibold text-[#3157eb]" href="/documents">Carica una polizza <ArrowRight size={16}/></Link></section>:<div className="space-y-5">
   {candidates.map(p=>{const annual=annualPremium(p);const isAuto=autos.some(a=>a.id===p.id);return <section key={p.id} className="overflow-hidden rounded-[24px] border border-[#e4eaf4] bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-5"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#74819a]">La tua assicurazione {isAuto?"auto":""}</p><h2 className="mt-1 text-xl font-extrabold text-[#142449]">{p.provider}</h2><p className="mt-1 text-xs text-[#687892]">{p.policyCategoryLabel||p.policyType}</p></div><div className="rounded-2xl bg-[#eef2ff] p-3 text-[#3157eb]">{isAuto?<CarFront size={24}/>:<ShieldCheck size={24}/>}</div></div>
    <div className="p-5"><p className="text-xs font-semibold text-[#6c7891]">Premio annuo attuale</p><p className="mt-1 text-[28px] font-extrabold tracking-tight text-[#142449]">{annual===null?"Da verificare":money(annual,p.currency)}</p><p className="mt-1 text-xs text-[#75819a]">{p.requiresReview?"Polizza da confermare: il premio non viene usato nel confronto.":annual===null?"Non è disponibile un premio annuale confermato.":"Calcolato dal premio e dalla frequenza registrati nella polizza."}</p>
    <div className="mt-5 rounded-2xl bg-[#f5f7fc] p-4"><h3 className="text-sm font-bold text-[#172747]">Cosa confrontare con un'altra compagnia</h3><div className="mt-3 grid grid-cols-2 gap-3">{(isAuto?["RC e massimali","Casco e rischi","Franchigie","Danni parcheggio","Assistenza","Esclusioni e territorio"]:["Prestazioni incluse","Limiti e massimali","Franchigie","Esclusioni","Ambito territoriale","Durata e disdetta"]).map(label=><div key={label} className="flex items-start gap-2 text-[12px] text-[#4a5d7d]"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#3157eb]"/>{label}</div>)}</div></div>
    <div className="mt-4 rounded-2xl border border-dashed border-[#d9e1f1] p-4"><div className="flex items-center gap-2 font-bold text-[#172747]"><CircleHelp size={18} className="text-[#3157eb]"/>Offerte concorrenti</div><p className="mt-2 text-[12px] leading-5 text-[#65748d]">Non ci sono ancora preventivi verificati. INSURA non mostra risparmi ipotetici come se fossero offerte.</p></div>
    <div className="mt-4 flex flex-wrap gap-4 text-[13px] font-semibold"><Link href={`/policies/${p.id}`} className="inline-flex items-center gap-1.5 text-[#3157eb]"><FileText size={16}/>Vedi la polizza</Link><Link href="/ask" className="inline-flex items-center gap-1.5 text-[#3157eb]">Chiedi a INSURA <ArrowRight size={16}/></Link></div>
    </div></section>})}
  </div>}
  <div className="rounded-[20px] border border-[#e4eaf4] bg-white p-5"><h2 className="font-bold text-[#142449]">Prossimo passo: offerte reali</h2><p className="mt-2 text-[13px] leading-6 text-[#65748d]">Per trovare un'alternativa conveniente dovremo raccogliere preventivi aggiornati da compagnie o partner, verificare che le coperture siano equivalenti e indicare chiaramente eventuali commissioni o collaborazioni commerciali.</p></div>
 </PageShell>;
}
