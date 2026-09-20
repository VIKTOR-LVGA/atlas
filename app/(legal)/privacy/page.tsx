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
      "Quando carichi un PDF, il testo del documento viene analizzato per proporre una bozza di polizza.",
      "Il risultato è una proposta da verificare: ATLAS conserva sempre la dicitura originale e l'indicazione della provenienza.",
      "Condizioni generali, fatture e materiale informativo vengono archiviati e classificati, ma non creano automaticamente una copertura sul tuo profilo.",
    ],
  },
  {
    title: "Condivisione con un consulente",
    body: [
      "Nessun dato viene condiviso con un consulente senza una tua richiesta esplicita e senza consenso, che non è preselezionato.",
      "Quando invii una richiesta di revisione scegli tu quali polizze e quali documenti rendere visibili.",
      "Il consulente assegnato vede solo gli elementi selezionati, oltre ai contatti necessari per ricontattarti. Non può consultare il resto del tuo portafoglio.",
      "Un consulente diverso da quello assegnato non vede né la richiesta né i dati condivisi.",
      "Le annotazioni interne del consulente e i dati economici dell'intermediazione non sono visibili nel tuo account.",
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
          Per domande sul trattamento dei dati durante il pilot, scrivi al referente ATLAS che
          ti ha invitato.
        </p>
      </section>
    </article>
  );
}
