import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { IconShield, IconCheck } from "@/components/icons";

const features = [
  {
    title: "Analisi intelligente",
    description:
      "Carica le tue polizze e ottieni un'analisi strutturata di coperture, esclusioni e criticità.",
  },
  {
    title: "Rilevamento doppioni",
    description:
      "Identifica sovrapposizioni tra polizze che potrebbero generare costi inutili.",
  },
  {
    title: "Benchmark di mercato",
    description:
      "Confronta i tuoi premi con la mediana svizzera per profili simili al tuo.",
  },
  {
    title: "Raccomandazioni personalizzate",
    description:
      "Azioni prioritarie con impatto stimato e difficoltà di implementazione.",
  },
  {
    title: "Documenti centralizzati",
    description:
      "Tutte le polizze in un unico posto, organizzate e sempre accessibili.",
  },
  {
    title: "Consulenza premium",
    description:
      "Revisione del portafoglio con esperti assicurativi indipendenti.",
  },
];

const steps = [
  {
    step: "01",
    title: "Carica le polizze",
    description: "Trascina i PDF delle tue polizze. Atlas li analizza in modo sicuro.",
  },
  {
    step: "02",
    title: "Ottieni l'analisi",
    description: "Visualizza coperture, gap, doppioni e punteggio salute assicurativa.",
  },
  {
    step: "03",
    title: "Agisci con consapevolezza",
    description: "Segui raccomandazioni prioritarie o prenota una consulenza dedicata.",
  },
];

const faqs = [
  {
    q: "Atlas vende polizze assicurative?",
    a: "No. Atlas è una piattaforma indipendente di analisi. Non vendiamo polizze né riceviamo commissioni da assicuratori.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Sì. I documenti sono crittografati, ospitati in Svizzera e trattati in conformità con la nLPD.",
  },
  {
    q: "Quanto è accurato il confronto di mercato?",
    a: "I benchmark sono indicativi, basati su profili aggregati anonimi. Non costituiscono un'offerta vincolante.",
  },
  {
    q: "Posso usare Atlas senza consulenza?",
    a: "Assolutamente. La dashboard e l'analisi sono disponibili in autonomia. La consulenza è un servizio aggiuntivo.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/80 via-slate-50 to-slate-50" />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center md:pt-28">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Piattaforma indipendente · Svizzera
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Capisci davvero le tue assicurazioni.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Carica le tue polizze, scopri coperture e criticità, confronta con il
            mercato svizzero e ottimizza il tuo portafoglio con decisioni informate.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              Inizia con la dashboard
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              Scopri come funziona
            </a>
          </div>
          <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/40">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Premio annuo", value: "CHF 12'840" },
                  { label: "Salute copertura", value: "72%" },
                  { label: "Polizze attive", value: "6" },
                  { label: "Risparmio pot.", value: "CHF 840+" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200/60 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium text-blue-600">Funzionalità</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900">
            Tutto ciò che serve per decidere con lucidità
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-600">
            Dall&apos;analisi documentale al confronto di mercato, Atlas ti offre
            una visione completa del tuo portafoglio assicurativo.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <IconShield />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm font-medium text-blue-600">Come funziona</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900">
            Tre passi verso la chiarezza
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <span className="text-4xl font-bold text-slate-100">{s.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-slate-200/60 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-blue-600">Sicurezza e fiducia</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                I tuoi dati meritano la massima protezione
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Atlas è progettato per la privacy svizzera. Nessuna vendita di dati,
                nessun intermediario assicurativo. Solo analisi indipendente al tuo servizio.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                "Hosting e crittografia in Svizzera",
                "Conformità nLPD e GDPR",
                "Nessuna vendita di dati a terzi",
                "Piattaforma indipendente da broker e assicuratori",
                "Eliminazione account e dati su richiesta",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <IconCheck />
                  </span>
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-center text-sm font-medium text-blue-600">FAQ</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-slate-900">
            Domande frequenti
          </h2>
          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-slate-900 px-8 py-14 text-center sm:px-16">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Pronto a capire le tue assicurazioni?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Accedi alla dashboard demo e esplora il tuo portafoglio assicurativo.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Vai alla dashboard
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
