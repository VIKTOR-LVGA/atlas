import { ArrowRight, CarFront, Check, ChevronRight, FileText, HeartPulse, Plus, ShieldCheck, Sparkles } from "lucide-react";
/* Illustrative mock UI only; no real customer, product or calculated insurance data. */
export function LandingDashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[570px]" aria-label="Anteprima illustrativa della dashboard INSURA">
      <div className="pointer-events-none absolute -inset-4 rounded-[38px] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] blur-3xl" aria-hidden/>
      <div className="atlas-demo-window relative overflow-hidden p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-muted">Esempio illustrativo</p><p className="mt-1 text-[17px] font-bold tracking-tight">Buongiorno, Alex</p></div>
          <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-accent-soft text-[13px] font-bold text-accent">A</span>
        </div>
        <div className="mt-5 rounded-[22px] bg-[#1b315a] p-5 text-white sm:p-6">
          <div className="flex items-start justify-between"><p className="text-[11px] font-semibold text-white/70">LA TUA SITUAZIONE</p><ShieldCheck className="h-5 w-5 text-white/70"/></div>
          <p className="mt-4 text-[13px] text-white/75">Polizze nel portafoglio</p>
          <div className="mt-1 flex items-end justify-between"><p className="text-[38px] font-bold leading-none tracking-[-.05em]">3</p><span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white">Esempio</span></div>
          <p className="mt-5 text-[11px] leading-relaxed text-white/70">Il tuo quadro in un colpo d&apos;occhio. I premi reali compaiono solo quando verificati.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[19px] border border-border bg-card-muted p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-accent-soft text-accent"><Check className="h-4 w-4"/></span><p className="mt-3 text-[11px] text-muted">Documenti</p><p className="text-[20px] font-bold tracking-tight">3 caricati</p></div>
          <div className="rounded-[19px] border border-border bg-card-muted p-4"><span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#e2f8f1] text-[#16856e]"><Sparkles className="h-4 w-4"/></span><p className="mt-3 text-[11px] text-muted">Analisi</p><p className="text-[20px] font-bold tracking-tight">Da verificare</p></div>
        </div>
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between"><p className="text-[13px] font-bold">Le tue polizze</p><span className="text-[11px] font-semibold text-accent">Vedi tutte <ArrowRight className="inline h-3 w-3"/></span></div>
          <div className="space-y-2.5">
            {[{Icon:HeartPulse,t:"Assicurazione malattia",s:"Dati da confermare"},{Icon:CarFront,t:"Assicurazione auto",s:"Documento disponibile"},{Icon:FileText,t:"Responsabilità civile",s:"Dettagli da verificare"}].map(({Icon,t,s})=>(
              <div key={t} className="flex items-center gap-3 rounded-[17px] border border-border px-3.5 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-accent-soft text-accent"><Icon className="h-[18px] w-[18px]"/></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-bold">{t}</span><span className="mt-0.5 block text-[10px] text-muted">{s}</span></span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted"/>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-[16px] bg-accent px-4 py-3 text-white">
          <span className="inline-flex items-center gap-2 text-[12px] font-bold"><Plus className="h-4 w-4"/> Carica una polizza</span><ArrowRight className="h-4 w-4"/>
        </div>
      </div>
    </div>
  );
}
