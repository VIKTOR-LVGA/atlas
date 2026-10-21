import { ArrowRight, CarFront, CalendarDays, HeartPulse, Home, Plus, ShieldCheck } from "lucide-react";

const examples = [
  { Icon: HeartPulse, name: "Assicurazione malattia", detail: "Premio mensile", amount: "CHF 385", status: "Confermata" },
  { Icon: CarFront, name: "Assicurazione auto", detail: "Premio annuale", amount: "CHF 780", status: "Confermata" },
  { Icon: Home, name: "Economia domestica", detail: "Premio annuale", amount: "CHF 245", status: "Da rivedere" },
];

export function LandingDashboardPreview() {
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-[24px] border border-[#e2e8f2] bg-white p-4 shadow-[0_14px_45px_rgba(18,26,41,0.06)] sm:rounded-[28px] sm:p-6" aria-label="Dashboard dimostrativa INSURA con dati inventati">
      <div className="flex items-center justify-between gap-3 border-b border-[#e8edf5] pb-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#3157eb]">Anteprima INSURA</p><h3 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#121a29]">Le tue assicurazioni</h3></div>
        <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-[10px] font-bold text-[#3157eb]">DEMO</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-[#f5f7fc] p-4"><p className="text-[11px] text-[#56647b]">Polizze</p><p className="mt-1 text-[27px] font-extrabold text-[#121a29]">3</p></div>
        <div className="rounded-[18px] bg-[#f5f7fc] p-4"><p className="text-[11px] text-[#56647b]">Stato</p><p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#3157eb]"><ShieldCheck className="h-4 w-4" /> 2 confermate</p></div>
      </div>
      <div className="mt-5 space-y-2.5">
        {examples.map(({Icon,name,detail,amount,status}) => (
          <div key={name} className="flex items-center gap-3 rounded-[18px] border border-[#e5eaf3] bg-white p-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#eef2ff] text-[#3157eb]"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[13px] font-bold leading-tight text-[#121a29]">{name}</p><p className="mt-1 text-[11px] text-[#647189]">{detail} · {status}</p></div>
            <strong className="shrink-0 text-[12px] font-extrabold text-[#121a29]">{amount}</strong>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[17px] bg-[#f0f4ff] px-4 py-3"><CalendarDays className="h-5 w-5 shrink-0 text-[#3157eb]" /><p className="text-[12px] font-semibold text-[#243656]">Prossima scadenza: 31.12.2026</p></div>
      <div className="mt-4 flex items-center justify-between rounded-[15px] bg-[#3157eb] px-4 py-3 text-white"><span className="inline-flex items-center gap-2 text-[12px] font-bold"><Plus className="h-4 w-4" /> Aggiungi una polizza</span><ArrowRight className="h-4 w-4" /></div>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-[#647189]">Dati e importi inventati, esclusivamente illustrativi. Non rappresentano premi reali né risultati di analisi.</p>
    </div>
  );
}
