export const metadata = {
  title: "Termini (bozza)",
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "Cos'è ATLAS",
    body: [
      "ATLAS è uno strumento per raccogliere e tenere in ordine le proprie assicurazioni: polizze, premi, scadenze e documenti.",
      "ATLAS non è un assicuratore e non è un comparatore di prezzi.",
    ],
  },
  {
    title: "Cosa non è",
    body: [
      "I contenuti mostrati non sono consulenza assicurativa, finanziaria o legale.",
      "L'indice di completezza misura quanti dati hai inserito nel tuo account: non valuta la qualità delle tue coperture.",
      "I promemoria derivano solo da dati presenti nel tuo account, ad esempio una scadenza vicina o un premio mancante.",
    ],
  },
  {
    title: "I dati che inserisci",
    body: [
      "Sei responsabile della correttezza dei dati che inserisci e dei documenti che carichi.",
      "Le bozze generate automaticamente dai PDF vanno verificate prima di considerarle affidabili.",
      "Carica solo documenti di cui hai il diritto di disporre.",
    ],
  },
  {
    title: "Revisione con un consulente",
    body: [
      "La revisione è facoltativa, gratuita per te e parte solo da una tua richiesta esplicita.",
      "Scegli tu quali dati rendere visibili al consulente assegnato.",
      "Una richiesta non comporta alcun obbligo di acquisto e non è un preventivo.",
      "Se decidi di stipulare un contratto, il rapporto assicurativo è tra te e la compagnia; ATLAS può ricevere una remunerazione dall'intermediazione.",
    ],
  },
  {
    id: "partner",
    title: "Condizioni Partner",
    body: [
      "La candidatura Partner è soggetta a verifica e approvazione ATLAS; la creazione dell'account non attribuisce automaticamente il ruolo broker.",
      "Il Partner può trattare esclusivamente richieste e risorse assegnate o condivise esplicitamente e deve rispettare riservatezza, protezione dei dati e obblighi professionali applicabili.",
      "ATLAS può sospendere l'accesso Partner per motivi di sicurezza, conformità o uso improprio, preservando i dati storici soggetti a obblighi di conservazione.",
      "Commissioni e attribuzioni economiche sono registrate secondo gli accordi applicabili e non costituiscono una promessa di volumi, lead o guadagni.",
    ],
  },
  {
    title: "Fase di pilot",
    body: [
      "Il servizio è in pilot controllato: funzionalità e interfaccia possono cambiare.",
      "La disponibilità non è garantita in modo continuo e alcune aree sono ancora in preparazione.",
    ],
  },
  {
    title: "Account",
    body: [
      "Sei responsabile della custodia delle tue credenziali.",
      "Puoi eliminare i tuoi documenti e le tue polizze in qualsiasi momento; la chiusura dell'account durante il pilot avviene su richiesta.",
    ],
  },
];

export default function TermsDraftPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Termini di utilizzo
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Condizioni di utilizzo di ATLAS durante il pilot controllato.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.title} id={"id" in section ? section.id : undefined}>
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
    </article>
  );
}
