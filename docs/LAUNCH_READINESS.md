# INSURA — checklist per il lancio pubblico

Stato: **PILOTA / NON APPROVATO PER LANCIO PUBBLICO**. La compilazione riuscita non costituisce un'approvazione di sicurezza, accuratezza o conformità.

## Verifiche tecniche (Codex: punti 1 e 4)
- [ ] Login, registrazione, recupero password, logout, scadenza sessione, permessi tra utenti diversi.
- [ ] Upload PDF valido/non valido, file 0 byte, >10 MB, errore storage, analisi fallita, retry, cancellazione.
- [ ] Conferma dati: una bozza AI non contribuisce ai totali verificati; dati incerti e documenti originali visibili.
- [ ] Mobile Safari e desktop: Home, wallet, PDF wizard, AI chat e navigazione da tastiera.
- [ ] Test estrazione con documenti reali anonimizzati in italiano, tedesco e francese; metriche per campo e soglie definite.
- [ ] Verifica link/fonti CGA e nessuna promessa di risparmio o copertura senza prove.

## Privacy, sicurezza, operazioni (prima di aprire al pubblico)
- [ ] Informativa privacy definitiva: titolare, finalità, basi giuridiche, categorie di dati, fornitori/sub-responsabili, trasferimenti, conservazione, cancellazione, contatti e diritti; revisione legale svizzera.
- [ ] Termini d'uso definitivi: limiti dell'analisi automatica, responsabilità, disponibilità del servizio e supporto; revisione legale.
- [ ] Verifica RLS su tutte le tabelle, storage privato e URL firmati; test accesso incrociato fra due utenti.
- [ ] Verifica che log e analytics non raccolgano PDF, dati assicurativi o informazioni identificative.
- [ ] Verifica segreti/variabili d'ambiente, rotazione chiavi, backup e prova di ripristino.
- [ ] Valutazione DPIA/valutazione d'impatto ove applicabile e documentazione dei trattamenti AI.
- [ ] Piano incidenti, canale di contatto, monitoraggio errori e processo di eliminazione account/dati.
- [ ] Verifica prestazioni e carico, limiti upload/rate limit, costi API e alert.
- [ ] Rimuovere eventuale noindex solo dopo approvazione esplicita al lancio.

## Gate di rilascio
- **GO PILOTA** solo dopo test funzionali e isolamento dati riusciti.
- **GO PUBBLICO** solo dopo tutte le verifiche, approvazione legale e consenso esplicito del proprietario.

## Recapiti configurati (caselle da attivare)
- Informazioni generali: `info@insura.ch`.
- Privacy e richieste sui dati: `privacy@insura.ch`.
- Le caselle non sono ancora state create sul dominio: non presentarle come operative né promettere risposta finché non sono attive.
- Prima del lancio verificare DNS MX/SPF/DKIM/DMARC, invio/ricezione, recapito delle richieste privacy e indicazione del titolare effettivo nell'informativa definitiva.
