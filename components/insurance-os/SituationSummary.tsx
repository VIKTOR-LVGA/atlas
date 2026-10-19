import { CalendarDays, FileCheck2, ShieldCheck, Wallet } from "lucide-react";
import { formatScheduleDate } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";

export type SituationSummaryInput = {
  annualCost: number | null; monthlyCost: number | null; insurers: string[];
  activePolicies: number; totalPolicies: number; coveredAreas: number | null;
  needsVerificationCount: number; overlapCount: number;
  nextDeadline: {date:string;label:string;daysUntil:number}|null;
};

/* Consumer-first: one financial figure, three facts. Unknown is never 0. */
export function SituationSummary({data}:{data:SituationSummaryInput}) {
  const metrics=[
    {Icon:ShieldCheck,label:"Polizze nel portafoglio",value:String(data.totalPolicies),hint:`${data.activePolicies} segnate come attive`},
    {Icon:CalendarDays,label:"Prossima scadenza",value:data.nextDeadline?formatScheduleDate(data.nextDeadline.date):"Da indicare",hint:data.nextDeadline?data.nextDeadline.label:"Completa le date delle polizze"},
    {Icon:FileCheck2,label:"Aree da controllare",value:String(data.needsVerificationCount),hint:data.needsVerificationCount>0?"Controlla i documenti originali":"Nessun dubbio segnalato nelle aree"},
  ];
  return (
    <section className="space-y-3" aria-label="La tua situazione assicurativa">
      <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative overflow-hidden rounded-[27px] bg-[#19305a] px-6 py-6 text-white sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full bg-[#658bff]/20 blur-[30px]" aria-hidden/>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] text-white/65">La tua spesa assicurativa</p>
              <Wallet className="h-5 w-5 text-white/75" aria-hidden/>
            </div>
            <p className="mt-5 break-words text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-.05em] leading-[1.1]">
              {data.annualCost!==null?formatCHF(data.annualCost):"Da completare"}
            </p>
            <p className="mt-1.5 text-[13px] font-medium text-white/75">
              {data.annualCost!==null?"Premi annui rilevati":"Aggiungi i premi delle tue polizze"}
            </p>
            <div className="mt-6 border-t border-white/15 pt-4 text-[12px] leading-relaxed text-white/70">
              {data.monthlyCost!==null
                ? `Media indicativa di ${formatCHF(data.monthlyCost)} al mese. I premi non disponibili restano esclusi.`
                : "Le cifre vengono mostrate solo quando presenti nei dati delle polizze."}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.slice(0,2).map(({Icon,label,value,hint})=>(
            <div key={label} className="atlas-premium-tile flex min-w-0 flex-col justify-between p-4 sm:p-5">
              <span className="atlas-pill-icon"><Icon className="h-5 w-5" aria-hidden/></span>
              <div className="mt-5">
                <p className="text-[11px] font-medium leading-snug text-muted">{label}</p>
                <p className="mt-1 break-words text-[clamp(1.2rem,2.6vw,1.75rem)] font-bold tracking-[-.05em] text-foreground">{value}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.needsVerificationCount>0?(
        <p className="flex items-center gap-2 rounded-[16px] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-[12px] text-[var(--warning-body)]">
          <ShieldCheck className="h-4 w-4 shrink-0"/>
          {metrics[2].value} aree con informazioni da verificare. Consulta i documenti prima di decidere.
        </p>
      ):null}
    </section>
  );
}
