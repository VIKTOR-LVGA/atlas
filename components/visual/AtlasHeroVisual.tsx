import { AtlasBrandMark } from "@/components/brand/AtlasBrandMark";
import { Bell, CalendarDays, CarFront, Check, ChevronRight, FileText, Heart, Home, Plus, ShieldCheck, Sparkles } from "lucide-react";

/**
 * Reference-faithful composition for the INSURA marketing hero.
 * This is a decorative, fictitious preview — never an actual user wallet.
 * Constructed from HTML/CSS so it scales gracefully to mobile and tablet.
 */
const mockPolicies = [
  { label: "Casa", subtitle: "Abitazione", Icon: Home, tone: "blue" },
  { label: "Auto", subtitle: "Mobilità", Icon: CarFront, tone: "blue" },
  { label: "Salute", subtitle: "Coperture", Icon: Heart, tone: "rose" },
];

export function AtlasHeroVisual() {
  return (
    <div className="atlas-ref-visual relative isolate w-full select-none" aria-label="Illustrazione di INSURA su smartphone, con polizze e analisi AI" role="img">



      <div className="pointer-events-none absolute left-[0%] top-[24%] z-20" aria-hidden="true"><AtlasBrandMark pose="wave" className="h-44 w-44 drop-shadow-[0_12px_18px_rgba(17,85,202,.24)] sm:h-60 sm:w-60" /></div>
      <div className="insura-handwritten-note" aria-hidden="true">Tutte le tue<br/>assicurazioni,<br/>sempre con te! <span>↘</span></div>
      <div className="atlas-ref-phone" aria-hidden>
        <div className="atlas-ref-phone-inner">
          <div className="atlas-ref-island"/>
          <div className="flex items-center justify-between pt-4 text-[9px] font-bold text-[#12234e]">
            <span>9:41</span><span className="flex items-center gap-1"><span>●●●</span><span className="inline-block h-2 w-4 rounded-sm border border-[#1d2b50]"><span className="block h-full w-3 bg-[#1d2b50]"/></span></span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <img src="/brand/insura-logo.svg" alt="" className="h-auto w-[95px]" />
            <span className="flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-[#1a3568]"/><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9eeff] text-[9px] font-bold text-[#2944a3]">MR</span></span>
          </div>
          <h3 className="mt-7 text-[22px] font-extrabold tracking-[-.055em] text-[#122046]">Ciao Marco <span aria-hidden>👋</span></h3>
          <p className="mt-1 text-[9px] text-[#6d7b98]">Ecco il riepilogo delle tue polizze.</p>
          <div className="mt-5 grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-[#f2f5ff] p-2"><FileText className="h-3.5 w-3.5 text-[#3e60eb]"/><p className="mt-3 text-[17px] font-bold text-[#10204a]">3</p><p className="text-[7px] leading-tight text-[#7180a2]">Polizze</p></div>
            <div className="rounded-xl bg-[#f1faf6] p-2"><ShieldCheck className="h-3.5 w-3.5 text-[#2dba8b]"/><p className="mt-3 text-[14px] font-bold text-[#10204a]">CHF</p><p className="text-[7px] leading-tight text-[#7180a2]">Premi</p></div>
            <div className="rounded-xl bg-[#fff2f3] p-2"><CalendarDays className="h-3.5 w-3.5 text-[#ef768d]"/><p className="mt-3 text-[17px] font-bold text-[#10204a]">2</p><p className="text-[7px] leading-tight text-[#7180a2]">Scadenze</p></div>
          </div>
          <div className="mt-6 flex items-center justify-between"><span className="text-[12px] font-bold text-[#152649]">Le tue polizze</span><span className="text-[8px] font-semibold text-[#3c61e8]">Vedi tutte</span></div>
          <div className="mt-2.5 space-y-2">
            {mockPolicies.map(({ label,subtitle,Icon,tone }) => (
              <div key={label} className="flex items-center gap-2 rounded-[13px] border border-[#edf1fa] bg-white px-2.5 py-2 shadow-[0_5px_12px_rgba(59,81,150,.07)]">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone==="rose"?"bg-[#ffe9ef] text-[#ed6b8b]":"bg-[#eaf0ff] text-[#4663e6]"}`}><Icon className="h-[18px] w-[18px]"/></span>
                <span className="min-w-0 flex-1"><strong className="block text-[10px] text-[#16254a]">{label}</strong><small className="block text-[8px] text-[#8b97ae]">{subtitle}</small></span>
                <span className="rounded-lg bg-[#e2f8ef] px-1.5 py-1 text-[7px] font-bold text-[#14966b]">Attiva</span><ChevronRight className="h-3 w-3 text-[#6580c7]"/>
              </div>
            ))}
          </div>
          <div className="atlas-ref-phone-nav">
            <span className="flex flex-col items-center gap-1 text-[#4566ec]"><Home className="h-4 w-4"/><small>Home</small></span>
            <span className="flex flex-col items-center gap-1"><FileText className="h-4 w-4"/><small>Polizze</small></span>
            <span className="grid h-9 w-9 -translate-y-2 place-items-center rounded-full bg-[#3659ef] text-white shadow-lg"><Plus className="h-5 w-5"/></span>
            <span className="flex flex-col items-center gap-1"><Sparkles className="h-4 w-4"/><small>AI</small></span>
            <span className="flex flex-col items-center gap-1"><ShieldCheck className="h-4 w-4"/><small>Profilo</small></span>
          </div>
        </div>
      </div>
      <span className="atlas-ref-art-note">Anteprima illustrativa</span>
    </div>
  );
}
