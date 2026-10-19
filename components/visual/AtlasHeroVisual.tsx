import { CalendarDays, Check, FileText, Layers3, ShieldCheck, Sparkles, Wallet } from "lucide-react";

/**
 * Self-contained illustration inspired by the approved ATLAS mockups.
 * Decorative interface — not a real extraction result or policy document.
 */
export function AtlasHeroVisual() {
  return (
    <div aria-hidden="true" className="atlas-visual-stage relative mx-auto w-full max-w-[570px] select-none">
      <div className="atlas-visual-halo" />
      <div className="atlas-visual-ring atlas-visual-ring-first" />
      <div className="atlas-visual-ring atlas-visual-ring-second" />

      <div className="atlas-visual-paper atlas-visual-paper-back">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7795dc]"><FileText className="h-4 w-4" /> Documento</span>
        <div className="mt-5 h-2 w-3/5 rounded-full bg-[#d6e1ff]" />
        <div className="mt-3 h-2 w-full rounded-full bg-[#e2e9fa]" />
        <div className="mt-3 h-2 w-4/5 rounded-full bg-[#e2e9fa]" />
      </div>
      <div className="atlas-visual-paper atlas-visual-paper-front">
        <div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-[#3157e9]"><FileText className="h-5 w-5" /></span><span className="text-[13px] font-bold text-[#233768]">La tua polizza</span></div>
        <div className="mt-6 space-y-3">
          <div className="h-2 w-4/5 rounded-full bg-[#e3eaf9]" /><div className="h-2 w-full rounded-full bg-[#e3eaf9]" /><div className="h-2 w-2/3 rounded-full bg-[#e3eaf9]" />
        </div>
        <span className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-[#eaf0ff] px-3 py-1.5 text-[11px] font-bold text-[#345fe1]"><FileText className="h-3.5 w-3.5"/> PDF</span>
      </div>

      <div className="atlas-visual-phone">
        <div className="atlas-visual-notch" />
        <div className="flex items-center justify-between pt-8">
          <span className="text-[13px] font-extrabold tracking-[.22em] text-[#203a84]">ATLAS</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf1ff] text-[#3157e9]"><ShieldCheck className="h-4 w-4" /></span>
        </div>
        <div className="mt-8 text-[23px] font-bold leading-tight tracking-[-.06em] text-[#172342]">Le tue polizze,<br/>più chiare.</div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#7c8aa9]">Un posto semplice per ritrovarle e capirle.</p>
        <div className="mt-6 space-y-2.5">
          {[
            { icon: ShieldCheck, label: "Coperture", tint: "#eaf4ff", ink: "#4770e9" },
            { icon: Wallet, label: "Premi", tint: "#e9f8f3", ink: "#259c77" },
            { icon: CalendarDays, label: "Scadenze", tint: "#fff0f3", ink: "#f17e93" },
          ].map(({ icon: Icon, label, tint, ink }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-[14px] border border-[#edf0fa] bg-white px-3 py-2.5 shadow-[0_5px_14px_rgba(48,73,136,.04)]">
              <span style={{ background: tint, color: ink }} className="flex h-8 w-8 items-center justify-center rounded-[10px]"><Icon className="h-[17px] w-[17px]"/></span>
              <span className="flex-1 text-[11px] font-bold text-[#243357]">{label}</span>
              <Check className="h-4 w-4 text-[#4db995]" />
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[14px] bg-[#345af0] px-3 py-3 text-center text-[11px] font-bold text-white">Aggiungi una polizza</div>
      </div>

      <div className="atlas-visual-floating atlas-visual-floating-top">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf0ff] text-[#3157e9]"><Layers3 className="h-[19px] w-[19px]"/></span>
        <span className="text-[12px] font-bold text-[#243560]">Le tue coperture</span>
        <Check className="h-4 w-4 text-[#24a888]" />
      </div>
      <div className="atlas-visual-floating atlas-visual-floating-bottom">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeeaff] text-[#6e55fa]"><Sparkles className="h-5 w-5"/></span>
        <span><strong className="block text-[12px] text-[#233560]">ATLAS AI</strong><small className="mt-0.5 block text-[10px] text-[#7886a4]">Bozza da verificare</small></span>
      </div>
      <p className="atlas-visual-disclaimer">Rappresentazione illustrativa</p>
    </div>
  );
}
