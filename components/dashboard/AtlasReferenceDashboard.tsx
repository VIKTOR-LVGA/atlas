import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, FileText, Plus, ShieldCheck, Wallet } from "lucide-react";
import { AtlasPolicyArtwork } from "@/components/visual/AtlasPolicyArtwork";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import { getPolicyProductName, getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getPolicyAnnualPremium } from "@/lib/premium-totals";
import { formatScheduleDate, formatScheduleDateFull, type PolicyDeadline } from "@/lib/policy-schedule";
import { formatCHF, formatFileSize } from "@/lib/utils";
import type { UserDocument, UserPolicy } from "@/lib/types";

type Props={
  policies:UserPolicy[];
  documents:UserDocument[];
  deadlines:PolicyDeadline[];
  activeCount:number;
  annualPremium:number|null;
  needsVerification:number;
};

const policyIcons={car:"🚗",household:"⌂",health:"♡",liability:"♧",other:"✦"} as const;

export function AtlasReferenceDashboard({policies,documents,deadlines,activeCount,annualPremium,needsVerification}:Props){
  const metrics=[
    {Icon:ShieldCheck,label:"Polizze attive",value:String(activeCount),hint:`${policies.length} totali nel portafoglio`,href:"/policies"},
    {Icon:Wallet,label:"Premi annui rilevati",value:annualPremium!==null?formatCHF(annualPremium):"Da completare",hint:"Solo importi disponibili",href:"/policies"},
    {Icon:CalendarDays,label:"Prossime scadenze",value:String(deadlines.length),hint:deadlines[0]?`La più vicina ${formatScheduleDate(deadlines[0].date)}`:"Nessuna data imminente",href:"/policies"},
    {Icon:FileText,label:"Documenti recenti",value:String(documents.length),hint:documents.length>0?"Apri i file caricati":"Archivio ancora vuoto",href:"/documents"},
  ];
  return (
    <div className="space-y-4">
      <section aria-label="I numeri del tuo portafoglio" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(({Icon,label,value,hint,href})=>(
          <Link key={label} href={href} className="atlas-ref-stat group flex min-h-[131px] flex-col justify-between rounded-[20px] p-4 sm:p-5">
            <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#ebefff] text-[#4260ed]"><Icon className="h-5 w-5" aria-hidden/></span><ChevronRight className="h-4 w-4 text-[#8695bc] transition-transform group-hover:translate-x-1"/></div>
            <div className="mt-3"><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><p className="mt-1 break-words text-[clamp(1.25rem,2.2vw,1.65rem)] font-extrabold leading-tight tracking-[-.045em] text-foreground">{value}</p><p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted">{hint}</p></div>
          </Link>
        ))}
      </section>
      <div className="grid items-start gap-4 xl:grid-cols-[1.08fr_.92fr]">
        <section className="atlas-ref-dashboard-panel min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-extrabold tracking-[-.035em] text-foreground">Le tue polizze</h2>
            <Link href="/policies" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent">Vedi tutte <ArrowRight className="h-3.5 w-3.5" aria-hidden/></Link>
          </div>
          {policies.length>0?(
            <ul className="space-y-2.5">
              {policies.slice(0,4).map(policy=>{
                const category=getVisualCategoryForPolicy(policy);
                const active=getPolicyStatusLabel(policy);
                const premium=getPolicyAnnualPremium(policy);
                return (
                  <li key={policy.id}>
                    <Link href={`/policies/${policy.id}`} className="atlas-ref-policy-row group flex min-h-[104px] items-center gap-3 overflow-hidden rounded-[17px] border border-border/70 bg-card p-3 transition-shadow hover:shadow-[0_10px_26px_rgba(55,84,152,.11)]">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#ebf0ff] text-[26px] font-bold text-[#4262e8]" aria-hidden>{policyIcons[category.id as keyof typeof policyIcons]??"✦"}</span>
                      <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-[13px] font-bold text-foreground">{category.label}</strong>{!policy.requiresReview?<span className="hidden rounded-full bg-[#e1f8ef] px-2 py-0.5 text-[9px] font-bold text-[#168c64] sm:inline-flex">{active}</span>:<span className="rounded-full bg-[#fff2da] px-2 py-0.5 text-[9px] font-bold text-[#b47716]">Da verificare</span>}</span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{policy.provider||"Compagnia da verificare"}{getPolicyProductName(policy)?` · ${getPolicyProductName(policy)}`:""}</span>
                        <span className="mt-1.5 block truncate text-[10px] text-muted">{premium!==null?`${formatCHF(premium)} / anno`:"Premio non disponibile"}</span>
                      </span>
                      <span className="hidden shrink-0 sm:block"><AtlasPolicyArtwork category={category.id}/></span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card text-accent shadow-sm"><ChevronRight className="h-4 w-4" aria-hidden/></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ):(
            <div className="rounded-2xl border border-dashed border-border p-6 text-center"><FileText className="mx-auto h-8 w-8 text-accent"/><p className="mt-2 text-[13px] font-semibold text-foreground">Ancora nessuna polizza</p><Link href="/documents" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-accent"><Plus className="h-4 w-4"/> Carica un PDF</Link></div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-[15px] bg-card-muted px-4 py-3 text-[12px]">
            <span className="text-muted-foreground">{needsVerification>0?`${needsVerification} aree da verificare`:"Controlla le coperture quando vuoi"}</span>
            <Link href="/atlas/checkup" className="font-bold text-accent">Check-up <ArrowRight className="inline h-3.5 w-3.5"/></Link>
          </div>
        </section>
        <div className="space-y-4">
          <section className="atlas-ref-dashboard-panel p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[17px] font-extrabold tracking-[-.035em] text-foreground">Prossime scadenze</h2><Link href="/policies" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent">Vedi tutte <ArrowRight className="h-3.5 w-3.5"/></Link></div>
            {deadlines.length?(
              <ul className="divide-y divide-border-subtle">
                {deadlines.slice(0,3).map(d=>{
                  const parts=formatScheduleDate(d.date).split(" ");
                  return <li key={d.policyId+"-"+d.date+"-"+d.kind}><Link href={`/policies/${d.policyId}`} className="group flex min-h-[65px] items-center gap-3 py-2">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#fff0f2] text-[#e25870]"><strong className="text-[17px] leading-none">{parts[0]}</strong><small className="mt-0.5 text-[9px] font-bold uppercase">{parts[1]?.slice(0,3)??""}</small></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-foreground">{d.label}</span><span className="mt-1 block text-[10px] text-muted">{d.daysUntil===0?"Oggi":`Tra ${d.daysUntil} giorni`}</span></span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted group-hover:text-accent"/>
                  </Link></li>;
                })}
              </ul>
            ):<p className="py-5 text-[13px] leading-relaxed text-muted">Non risultano scadenze imminenti nelle polizze inserite.</p>}
          </section>
          <section className="atlas-ref-dashboard-panel p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[17px] font-extrabold tracking-[-.035em] text-foreground">Documenti recenti</h2><Link href="/documents" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent">Vedi tutti <ArrowRight className="h-3.5 w-3.5"/></Link></div>
            {documents.length?(
              <ul className="divide-y divide-border-subtle">
                {documents.slice(0,3).map(doc=><li key={doc.id}><Link href={`/documents/${doc.id}`} className="flex min-h-[58px] items-center gap-3 py-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ebf0ff] text-[#3a60ee]"><FileText className="h-5 w-5" aria-hidden/></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-foreground">{doc.fileName}</span><span className="mt-1 block text-[10px] text-muted">{formatFileSize(doc.fileSize)}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted"/>
                </Link></li>)}
              </ul>
            ):<Link href="/documents" className="inline-flex min-h-[62px] items-center gap-2 text-[13px] font-semibold text-accent"><FileText className="h-5 w-5"/> Carica il tuo primo documento</Link>}
          </section>
        </div>
      </div>
      <div className="grid gap-2 rounded-[22px] border border-border bg-card px-4 py-4 text-[11px] text-muted-foreground sm:grid-cols-4 sm:gap-3 sm:px-6">
        {["Carica i documenti","Analisi AI da verificare","Tutte le polizze insieme","Più chiarezza su costi e scadenze"].map((label,i)=><div key={label} className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-accent-soft text-[11px] font-bold text-accent">{String(i+1).padStart(2,"0")}</span><span className="font-semibold">{label}</span></div>)}
      </div>
    </div>
  );
}
