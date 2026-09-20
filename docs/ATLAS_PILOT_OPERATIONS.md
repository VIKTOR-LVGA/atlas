# ATLAS — Operazioni per il pilot controllato

Questo documento descrive le procedure necessarie per condurre un pilot con pochi
utenti reali e un broker reale. Non descrive un lancio pubblico.

## Ambienti

| Ambiente | Ruolo | Contenuto |
| --- | --- | --- |
| Production corrente | dominio pubblico già attivo | versione consumer precedente all'intera ATLAS 2.0/Broker |
| Staging ATLAS 2.0 | deployment Preview dedicato | branch `feat/atlas-broker`, usato per il pilot |

Regole:

- lo staging usa lo stesso progetto Supabase `ycjltpxxetxvuptwlxlr`, quindi i dati
  del pilot sono dati reali: vale la stessa cura della produzione;
- nel browser arrivano solo `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; nessuna chiave server è esposta;
- gli URL di redirect Auth devono includere il dominio staging prima di invitare
  utenti, altrimenti conferma email e reset password rimandano al dominio sbagliato.

## Bootstrap del primo admin

Il prodotto non consente in alcun modo di ottenere il ruolo `admin` dall'interfaccia:
il trigger su `auth.users` assegna sempre `consumer`, e `set_user_role` richiede che
il chiamante sia già admin. Il primo admin va quindi creato fuori dall'app, una sola
volta, da chi detiene la service role key.

1. La persona si registra normalmente su ATLAS con la propria email di lavoro.
2. Chi detiene la service role key esegue, esportando la chiave solo per quel comando:

   ```bash
   SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env.local \
     scripts/atlas-grant-role.mjs persona@azienda.ch admin
   ```

3. Lo script rifiuta di creare un secondo admin se ne esiste già uno, a meno di
   `--force`. Non crea account e non tocca le RLS.
4. Annotare la concessione nel registro operativo interno (chi, quando, perché).

La service role key non va messa in `.env.local` condiviso, non va nel repository e
non va nelle variabili del progetto Vercel usate dal runtime browser.

## Onboarding del primo broker

Nessuna query SQL manuale è necessaria dopo che esiste un admin.

1. Il broker si registra su ATLAS con la sua email di lavoro (resta `consumer`).
2. L'admin recupera l'identificativo account del broker da Supabase → Authentication.
3. In `/admin` → **Broker attivi** → *Registra nuovo broker*, l'admin inserisce
   identificativo account, nome visualizzato, email, e facoltativamente ragione
   sociale, organizzazione, telefono e stato attivo/inattivo.
4. L'azione crea il record `brokers` e assegna il ruolo `broker` nello stesso passaggio.
5. Al successivo accesso il broker viene instradato su `/broker` e non può più aprire
   le aree consumer o admin.

Limite noto per il pilot: l'admin deve copiare l'identificativo account dalla console
Supabase perché la risoluzione email → account richiederebbe privilegi che non
appartengono alla sessione browser. Un invito broker per email è il naturale passo
successivo, non necessario per il pilot.

## Identità di test

Per il pilot servono account separati dagli account personali:

- `ADMIN_TEST`, `BROKER_TEST`, `CONSUMER_A`, `CONSUMER_B`.

Regole:

- le password non vanno nel repository; usare un password manager condiviso;
- gli account personali non vanno usati nei test automatici;
- gli script di validazione creano account dedicati derivati da un run id
  (`ATLAS_BROKER_RUN_ID`), così ogni esecuzione è isolata.

## Registrazione manuale delle commissioni

Per il pilot non esiste alcuna integrazione con gli assicuratori: l'attribuzione è
manuale e volutamente tale.

1. Serve un accordo commissionale attivo alla data di maturazione
   (`/admin` → *Nuovo accordo commissionale*): definisce le percentuali ATLAS/broker.
2. L'admin registra la commissione sulla richiesta assegnata, indicando assicuratore,
   prodotto, categoria, tipo (acquisizione/rinnovo/ricorrente), lordo, tasso,
   data di maturazione, stato e riferimento esterno.
3. Lo split ATLAS/broker viene calcolato e **storicizzato** sulla riga: modifiche
   successive all'accordo non riscrivono le attribuzioni passate.
4. Clawback e correzioni si registrano come rettifiche append-only nel ledger, con
   motivazione obbligatoria; il valore originale resta leggibile.
5. Un rinnovo si collega alla commissione dell'anno precedente tramite la
   commissione padre, così il reporting distingue acquisizione e rinnovo.

## Diagnostica errori

Le boundary di errore consumer, broker e admin registrano solo eventi tecnici
privacy-safe (`code`, `route` senza UUID, `digest`, `role`) nei log Vercel/Next.
Non vengono loggati contenuti di documenti, password, token, email o dati di
polizza. Un servizio di error monitoring esterno (Sentry o equivalente) resta
facoltativo: per il pilot i log di piattaforma sono sufficienti.

## Email e dominio mittente

Il prodotto non usa `onboarding@resend.dev` nel codice, ma non esiste ancora un
dominio ATLAS verificato per le email di Auth (conferma, reset password).
Finché il mittente resta quello di default Supabase/Resend, il **lancio pubblico
è bloccato**. Per il pilot si possono usare account invitati e confermati a mano.

EMAIL DOMAIN REQUIRED prima del lancio pubblico.

## Superfici legali

`/privacy` e `/terms` esistono come **bozze da revisione legale**, con banner
esplicito e `noindex`. LEGAL REVIEW REQUIRED prima del lancio pubblico.

## Cancellazione account

- export dati: disponibile in Impostazioni → Avanzate (JSON e CSV);
- eliminazione documenti e portfolio: self-service, con conferma;
- chiusura completa dell'account: su richiesta, non automatica, perché contratti
  e commissioni possono avere obblighi di conservazione. Non si esegue una
  cancellazione a cascata dal browser.

## Cosa non è previsto nel pilot

API assicuratori, import automatico commissioni, processore di pagamento,
integrazione calendario, team broker strutturati, consigli assicurativi automatici,
comparazione prezzi, forecasting e app nativa.
