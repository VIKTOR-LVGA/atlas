import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const pages = {
  "come-funziona": {
    title: "Come funziona INSURA",
    intro: "Un percorso semplice per organizzare le polizze, comprendere i dati estratti e verificare le informazioni prima di salvarle.",
    sections: [
      ["1. Carica un documento", "Dopo la registrazione puoi caricare una polizza in formato PDF dalla tua area privata."],
      ["2. Esamina la bozza", "INSURA tenta di leggere e organizzare informazioni come compagnia, premio, coperture e scadenze. I campi non verificabili devono restare da confermare."],
      ["3. Controlla e conferma", "Confronta sempre la bozza con il PDF originale. L'analisi automatica non sostituisce il contratto né una consulenza qualificata."]
    ]
  },
  "sicurezza": {
    title: "Sicurezza dei documenti",
    intro: "Le polizze contengono informazioni personali. INSURA prevede un accesso tramite account e controlli sui documenti.",
    sections: [
      ["Area personale", "Le funzionalità di caricamento e consultazione delle polizze richiedono l'accesso al proprio account."],
      ["Analisi assistita", "I risultati dell'intelligenza artificiale possono contenere errori o omissioni: è necessario verificarli sul documento originale."],
      ["Attenzione ai dati sensibili", "Prima di caricare un documento, consulta le informazioni sulla privacy e sul trattamento dei dati. Non condividere credenziali o documenti tramite canali non ufficiali."]
    ]
  },
  "faq": {
    title: "Domande frequenti",
    intro: "Le risposte alle domande più comuni su INSURA.",
    sections: [
      ["INSURA è gratuito per gli utenti?", "L'accesso alle funzionalità consumer è previsto gratuitamente. Eventuali servizi futuri differenti saranno descritti esplicitamente."],
      ["INSURA vende polizze?", "INSURA è pensato per aiutare gli utenti a organizzare e comprendere i propri documenti assicurativi, non per sostituire una compagnia assicurativa."],
      ["L'intelligenza artificiale può sbagliare?", "Sì. Un campo non letto o ambiguo non deve essere interpretato come certo. Controlla sempre i dati sulla polizza originale."],
      ["Devo creare un account?", "Per caricare documenti e accedere alla tua area privata è necessario registrarsi o effettuare l'accesso."],
      ["Posso consultare queste informazioni senza registrarmi?", "Sì. Le pagine informative pubbliche sono disponibili senza login."]
    ]
  },
  "intelligence": {
    title: "INSURA Intelligence",
    intro: "Una panoramica pubblica del progetto di analisi e intelligence assicurativa. Non è necessario accedere per conoscere il servizio.",
    sections: [
      ["Per gli utenti", "INSURA mira a rendere più comprensibili premi, franchigie, coperture e scadenze, partendo dai documenti caricati."],
      ["Analisi e tendenze", "La visione Intelligence prevede indicatori aggregati utili a comprendere i bisogni e le preferenze assicurative. Questa pagina non presenta statistiche reali o dati di utenti."],
      ["Privacy e disponibilità", "Eventuali statistiche destinate a partner o compagnie richiedono controlli appropriati di privacy, aggregazione e autorizzazione. Le funzionalità professionali non sono presentate qui come già disponibili."],
      ["Vuoi utilizzare INSURA?", "L'analisi delle tue polizze si trova nell'area personale e richiede l'accesso."]
    ]
  },
  "funzionalita": {
    title: "Funzionalità di INSURA",
    intro: "Un unico spazio per raccogliere e comprendere meglio le tue assicurazioni.",
    sections: [
      ["Archivio delle polizze", "Organizza i documenti assicurativi associati al tuo account."],
      ["Lettura assistita dei PDF", "L'AI può preparare una bozza strutturata delle informazioni riconosciute nei documenti."],
      ["Verifica dei dati", "Controlla premi, coperture e scadenze prima di considerare confermati i dati estratti."],
      ["Consultazione da mobile", "L'interfaccia è progettata anche per smartphone."]
    ]
  },
  "trasparenza": {
    title: "Dati e trasparenza",
    intro: "Chiarezza su ciò che INSURA fa e sui limiti delle analisi automatiche.",
    sections: [
      ["Dati estratti, non inventati", "I valori assicurativi devono provenire dai documenti. Se un'informazione manca, è illeggibile o è ambigua, deve essere segnalata come non verificata."],
      ["Il documento resta il riferimento", "Le informazioni mostrate da INSURA sono un supporto alla lettura. In caso di discrepanze fa fede la documentazione contrattuale originale."],
      ["Informazioni personali", "I documenti assicurativi possono contenere dati personali e sensibili. Consulta l'informativa privacy e i termini applicabili prima di utilizzare il servizio."],
      ["Versione pilota", "Le funzioni e i risultati possono evolvere. Evitiamo di presentare come definitive funzionalità o statistiche ancora in fase di sviluppo."]
    ]
  }
} as const;

type Slug = keyof typeof pages;
function isSlug(value: string): value is Slug { return Object.prototype.hasOwnProperty.call(pages, value); }

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return isSlug(slug) ? { title: pages[slug].title, description: pages[slug].intro } : {};
}

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const page = pages[slug];
  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 md:py-20">
        <Link href="/" className="text-sm font-semibold text-[#4265f5] hover:underline">← Torna alla homepage</Link>
        <div className="mt-10 rounded-[30px] border border-[#dce5f6] bg-white/90 px-6 py-10 shadow-sm sm:px-12 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#4966d9]">INSURA · Informazioni</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#142342] sm:text-5xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#5d6b84]">{page.intro}</p>
          <div className="mt-10 space-y-5">
            {page.sections.map(([title, body]) => (
              <section key={title} className="rounded-2xl border border-[#e4eaf5] bg-[#f8faff] p-6">
                <h2 className="text-lg font-bold text-[#18294a]">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#586986]">{body}</p>
              </section>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-xl bg-[#4265f5] px-5 py-3 text-sm font-bold text-white">Inizia gratis</Link>
            <Link href="/login" className="rounded-xl border border-[#dce5f6] px-5 py-3 text-sm font-bold text-[#23365b]">Accedi</Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
