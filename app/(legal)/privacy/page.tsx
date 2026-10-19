const supportEmail = process.env.NEXT_PUBLIC_ATLAS_SUPPORT_EMAIL?.trim();

export const metadata = {
  title: "Privacy (bozza)",
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "Quali dati tratta ATLAS",
    body: [
      "Dati dell'account: email, nome, telefono e preferenze di lingua, valuta e formato data.",
      "Dati assicurativi che inserisci tu: polizze, premi, date, coperture, nucleo familiare, abitazioni e veicoli.",
      "Documenti che carichi: PDF assicurativi conservati in uno spazio privato collegato al tuo account.",
      "Dati tecnici minimi necessari al funzionamento dell'autenticazione e della sessione.",
    ],
  },
  {
    title: "Perché li trattiamo",
    body: [
      "Per mostrarti in un unico posto premi, scadenze, documenti e dati incompleti del tuo portafoglio.",
      "Per generare promemoria basati esclusivamente sui dati presenti nel tuo account.",
      "Per gestire, solo su tua richiesta esplicita, una revisione con un consulente partner.",
    ],
  },
  {
    title: "Estrazione automatica dai documenti",
    body: [
      "Il caricamento conserva il PDF nel tuo archivio privato. Quando avvii l'analisi AI, il testo del documento viene elaborato tramite il servizio esterno OpenAI per proporre una bozza di polizza.",
      "L'analisi può essere incompleta o contenere errori. Controlla sempre la polizza originale, i premi e le coperture prima di confermare o prendere decisioni.",
      "Condizioni generali, fatture e materiale informativo vengono archiviati e classificati, ma non creano automaticamente una copertura sul tuo profilo.",
    ],
  },
  {
    title: "Domande ad ATLAS e simulazioni",
    body: [
      "Quando fai una domanda o simuli uno scenario, ATLAS usa i dati pertinenti del tuo portafoglio per formulare la risposta; quando è necessaria una generazione AI, può trasmettere la domanda e il contesto selezionato al servizio OpenAI.",
      "Le risposte automatiche sono informative: le coperture, i limiti e le esclusioni devono essere verificati sui documenti assicurativi originali.",
    ],
  },
  {
    title: "Condivisione con un consulente",
    body: [
      "Nessun dato viene condiviso con un consulente senza una tua richiesta esplicita e senza consenso, che non è preselezionato.",
      "Quando invii una richiesta di revisione scegli tu quali polizze e quali documenti rendere visibili.",
      "ATLAS gestisce la richiesta; un consulente partner potrà essere coinvolto solo successivamente e solo rispetto agli elementi che hai scelto di condividere.",
      "Nessun accesso automatico al resto del tuo portafoglio.",
    ],
  },
  {
    title: "Conservazione e cancellazione",
    body: [
      "Puoi esportare i dati del tuo account dalle impostazioni, in formato strutturato.",
      "Puoi eliminare singoli documenti e singole polizze in autonomia, in qualsiasi momento.",
      "La chiusura completa dell'account durante il pilot avviene su richiesta, per poter verificare cosa deve essere conservato per obblighi contabili quando esistono contratti o commissioni collegate.",
    ],
  },
  {
    title: "Cosa ATLAS non fa",
    body: [
      "Non vende i tuoi dati.",
      "Non mostra i tuoi dati ad altri utenti.",
      "Non formula raccomandazioni assicurative automatiche e non promette risparmi.",
    ],
  },
];

export default function PrivacyDraftPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Informativa privacy
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Descrive quali dati ATLAS tratta, perché, e cosa viene condiviso con un consulente
          quando lo chiedi tu.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            {section.title}
          </h2>
          <ul className="mt-3 space-y-2">
            {section.body.map((line) => (
              <li key={line} className="text-[13px] leading-relaxed text-muted">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Contatti</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {supportEmail ? (
            <>
              Per richieste sulla privacy e assistenza scrivi a{" "}
              <a className="font-medium text-accent underline" href={"mailto:" + supportEmail}>
                {supportEmail}
              </a>.
            </>
          ) : (
            "Per richieste sulla privacy o assistenza, contatta il referente ATLAS che ti ha invitato."
          )}
        </p>
      </section>
    </article>
  );
}
