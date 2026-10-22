import { LandingSection, LandingSectionHeader } from "@/components/landing/LandingSection";

const faqs = [
  {
    q: "Insura vende polizze assicurative?",
    a: "INSURA non emette né vende direttamente polizze. Ti aiuta a organizzare e comprendere quelle che possiedi. Eventuali servizi di consulenza e partnership commerciali saranno indicati chiaramente prima della richiesta.",
  },
  {
    q: "Cosa fa l'estrazione AI in pratica?",
    a: "Legge i PDF delle polizze svizzere, normalizza i campi (persone, coperture, premi, franchigie) e crea schede strutturate da rivedere e confermare.",
  },
  {
    q: "Posso correggere le assegnazioni tra persone e coperture?",
    a: "Sì. Nel flusso di revisione puoi riassegnare ogni copertura a qualsiasi persona assicurata, modificare premi e confermare la polizza.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Insura tratta i documenti con attenzione e controllo. I PDF restano nel tuo account e le bozze AI vanno confermate prima dell'uso.",
  },
];

export function LandingFaq() {
  return (
    <LandingSection id="faq" tone="deep" className="py-12 md:py-16">
      <div className="mx-auto max-w-2xl px-6">
        <LandingSectionHeader
          eyebrow="FAQ"
          title="Domande frequenti"
          align="center"
        />

        <div className="mt-7 space-y-2">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              name="insura-faq" className="group rounded-xl border border-[#e4eaf5] bg-white px-4 py-3.5 transition open:border-[#cbd8ff] open:bg-[#f7f9ff]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[var(--landing-text)] marker:content-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="shrink-0 text-muted transition group-open:rotate-45 group-open:text-indigo-400">
                  +
                </span>
              </summary>
              <p className="mt-3 border-t border-[#e4eaf5] pt-3 text-sm leading-relaxed text-[#53647e]">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
