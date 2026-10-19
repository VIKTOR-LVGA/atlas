import { Bell, CalendarDays, CarFront, Check, ChevronRight, FileText, Heart, Home, Plus, ShieldCheck, Sparkles } from "lucide-react";

/**
 * Reference-faithful composition for the ATLAS marketing hero.
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
    <div className="atlas-ref-visual relative isolate w-full select-none" aria-label="Illustrazione di ATLAS su smartphone, con polizze e analisi AI" role="img">
      <div className="atlas-ref-ribbon atlas-ref-ribbon-one" aria-hidden />
      <div className="atlas-ref-ribbon atlas-ref-ribbon-two" aria-hidden />
      <div className="atlas-ref-pedestal" aria-hidden />
      <div className="atlas-ref-document atlas-ref-document-back" aria-hidden>
        <div className="h-2 w-20 rounded-full bg-[#aec5fa]" /><div className="mt-3 h-2 w-32 rounded-full bg-[#e1e9ff]" />
      </div>
      <div className="atlas-ref-document atlas-ref-document-front" aria-hidden>
        <span className="font-bold tracking-[.18em] text-[#4263d7]">POLIZZA</span>
        <div className="mt-5 h-2 w-full rounded-full bg-[#d7e3fa]" />
        <div className="mt-3 h-2 w-4/5 rounded-full bg-[#e1e9fa]" />
        <div className="mt-3 h-2 w-5/6 rounded-full bg-[#e1e9fa]" />
        <div className="mt-7 inline-flex items-center gap-1 rounded-lg bg-[#ebf0ff] px-2 py-1 text-[10px] text-[#4665d5]"><FileText className="h-3 w-3"/> PDF</div>
      </div>
      <div className="atlas-ref-phone" aria-hidden>
        <div className="atlas-ref-phone-inner">
          <div className="atlas-ref-island"/>
          <div className="flex items-center justify-between pt-4 text-[9px] font-bold text-[#12234e]">
            <span>9:41</span><span className="flex items-center gap-1"><span>●●●</span><span className="inline-block h-2 w-4 rounded-sm border border-[#1d2b50]"><span className="block h-full w-3 bg-[#1d2b50]"/></span></span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="text-[17px] font-black italic text-[#3b5cef]">A</span><span className="text-[10px] font-extrabold tracking-[.21em] text-[#0e2050]">ATLAS</span></span>
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
      <div className="atlas-ref-float atlas-ref-analyzing" aria-hidden>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#edf0ff] text-[#5966ed]"><Sparkles className="h-5 w-5"/></span>
        <span className="min-w-0"><strong className="block text-[12px] text-[#20345a]">Analizzo le polizze...</strong><span className="mt-1.5 block h-1.5 w-28 overflow-hidden rounded-full bg-[#e8edff]"><span className="block h-full w-[65%] rounded-full bg-[#4466f5]"/></span></span>
      </div>
      <div className="atlas-ref-float atlas-ref-tag atlas-ref-tag-house" aria-hidden>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf0ff] text-[#4661d8]"><Home className="h-6 w-6"/></span>
        <span><strong className="block text-[11px] text-[#172a51]">Polizza Casa</strong><small className="text-[9px] text-[#8492ac]">Da verificare</small></span>
        <Check className="ml-auto h-4 w-4 text-[#2cb88c]"/>
      </div>
      <div className="atlas-ref-float atlas-ref-tag atlas-ref-tag-car" aria-hidden>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e9efff] text-[#5274e4]"><CarFront className="h-6 w-6"/></span>
        <span><strong className="block text-[11px] text-[#172a51]">Polizza Auto</strong><small className="text-[9px] text-[#8492ac]">Organizzata</small></span>
        <Check className="ml-auto h-4 w-4 text-[#2cb88c]"/>
      </div>
      <div className="atlas-ref-float atlas-ref-tag atlas-ref-tag-health" aria-hidden>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0f4] text-[#eb6c8d]"><Heart className="h-6 w-6"/></span>
        <span><strong className="block text-[11px] text-[#172a51]">Polizza Salute</strong><small className="text-[9px] text-[#8492ac]">Da verificare</small></span>
      </div>
      <div className="atlas-ref-glass-shield" aria-hidden>
        <svg width="100%" height="100%" viewBox="0 0 172 190" fill="none">
          <defs><linearGradient id="refShield" x1="25" y1="0" x2="135" y2="185" gradientUnits="userSpaceOnUse"><stop stopColor="#ecf6ff"/><stop offset=".32" stopColor="#7aafff"/><stop offset=".76" stopColor="#1754ed"/><stop offset="1" stopColor="#071d7e"/></linearGradient><linearGradient id="refEdge" x1="0" y1="0" x2="172" y2="190"><stop stopColor="white"/><stop offset=".55" stopColor="#91caff"/><stop offset="1" stopColor="#dae8ff"/></linearGradient></defs>
          <path d="M86 7 160 40v55c0 44-28 72-74 88C41 167 12 139 12 95V40L86 7Z" fill="url(#refShield)" stroke="url(#refEdge)" strokeWidth="7"/>
          <path d="M86 21 145 48v47c0 35-20 56-59 73C48 151 27 130 27 95V48L86 21Z" stroke="#d6eaff" strokeOpacity=".65" strokeWidth="2"/>
          <path d="m53 91 23 23 45-49" stroke="white" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="m54 89 21 22 45-49" stroke="#d8eaff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="atlas-ref-art-note">Anteprima illustrativa</span>
    </div>
  );
}
