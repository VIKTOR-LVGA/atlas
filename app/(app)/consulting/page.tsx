import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { CTABox } from "@/components/ui/CTABox";
import { LinkAction } from "@/components/ui/LinkAction";
import {
  IconChat,
  IconChevronRight,
  IconCalendar,
  IconShield,
} from "@/components/icons";

export const metadata = { title: "Consulenza" };

const packages = [
  {
    icon: "chat",
    title: "Call introduttiva",
    desc: "30 minuti con un consulente",
    price: "Gratuito",
  },
  {
    icon: "doc",
    title: "Revisione portafoglio",
    desc: "Analisi fino a 6 polizze",
    price: "CHF 290",
  },
  {
    icon: "crown",
    title: "Premium Portfolio Review",
    desc: "Analisi completa + follow-up",
    price: "CHF 590",
  },
];

const actions = [
  { title: "Parla con un consulente", desc: "Chat o video call", color: "bg-blue-50 text-blue-600" },
  { title: "Revisione documenti", desc: "Invia le tue polizze", color: "bg-emerald-50 text-emerald-600" },
  { title: "Controversia assicurativa", desc: "Supporto legale", color: "bg-violet-50 text-violet-600" },
  { title: "Verifica coperture", desc: "Gap analysis", color: "bg-amber-50 text-amber-600" },
];

const faqs = [
  "Come funziona la consulenza?",
  "I consulenti sono indipendenti?",
  "Posso annullare un appuntamento?",
];

export default function ConsultingPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Consulenza"
        description="Parla con i nostri esperti e prendi decisioni assicurative consapevoli."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Il tuo consulente">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-2xl font-semibold text-slate-600">
                  LV
                </div>
                <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-slate-900">Luca Verdi</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    Consulente certificato
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                  Oltre 10 anni di esperienza in consulenza assicurativa indipendente in Svizzera.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { v: "500+", l: "Clienti seguiti" },
                    { v: "4.9/5", l: "Valutazione" },
                    { v: "98%", l: "Soddisfazione" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-slate-50 py-2">
                      <p className="text-[13px] font-semibold text-slate-900">{s.v}</p>
                      <p className="text-[10px] text-slate-500">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Certificato", "Indipendente", "Nessun vincolo"].map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pacchetti disponibili">
            <ul className="divide-y divide-slate-50">
              {packages.map((pkg) => (
                <li
                  key={pkg.title}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <IconChat className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-900">{pkg.title}</p>
                    <p className="text-[11px] text-slate-500">{pkg.desc}</p>
                  </div>
                  <p className="text-[13px] font-semibold text-slate-900">{pkg.price}</p>
                  <button
                    type="button"
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-[12px] font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Seleziona
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Domande frequenti">
            <ul className="divide-y divide-slate-50">
              {faqs.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-left text-[13px] text-slate-800"
                  >
                    {q}
                    <IconChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Prenota appuntamento">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
                {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`aspect-square rounded text-[11px] ${
                      i === 14
                        ? "bg-blue-600 font-medium text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["09:00", "11:00", "14:00", "16:00"].map((t, i) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${
                    i === 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              <IconCalendar className="h-4 w-4" />
              Prenota appuntamento
            </button>
          </SectionCard>

          <SectionCard title="Ultimi messaggi" action={<LinkAction href="#">Vedi tutti</LinkAction>} padding="sm">
            <ul className="space-y-2">
              {[
                { n: "Luca Verdi", m: "Ho rivisto la polizza mobilia...", t: "2h" },
                { n: "Supporto Atlas", m: "Il tuo report è pronto", t: "1g" },
              ].map((msg) => (
                <li key={msg.n} className="flex gap-2 rounded-lg border border-slate-50 p-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium">
                    {msg.n[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-slate-800">{msg.n}</p>
                    <p className="truncate text-[11px] text-slate-500">{msg.m}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{msg.t}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-[12px] font-medium text-slate-700"
            >
              <IconChat className="h-4 w-4" />
              Apri chat
            </button>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cosa vuoi fare oggi?" padding="sm">
          <ul className="divide-y divide-slate-50">
            {actions.map((a) => (
              <li key={a.title}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.color}`}>
                    <IconShield className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-900">{a.title}</p>
                    <p className="text-[11px] text-slate-500">{a.desc}</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <CTABox
          title="Analisi approfondita"
          description="Revisione completa del portafoglio con piano d'azione personalizzato."
          checklist={[
            "Report PDF dettagliato",
            "60 minuti di consulenza video",
            "Follow-up a 90 giorni",
          ]}
          buttonLabel="Richiedi la tua analisi gratuita"
          buttonHref="/consulting"
        />
      </div>
    </div>
  );
}
