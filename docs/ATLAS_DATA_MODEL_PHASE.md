# ATLAS 2.0 — Data Model Phase

## Decisione architetturale

Il profilo autenticato rimane la persona principale e non viene duplicato automaticamente in `family_members`. Le altre persone, gli immobili e i veicoli sono entità relazionali perché hanno identità, ciclo di vita e collegamenti propri. I dettagli assicurativi specialistici e poco stabili restano in JSON validato; le coperture acquistate diventano invece righe canoniche interrogabili in `policy_coverages`.

Questa separazione evita sia un modello rigido con decine di colonne specifiche per prodotto, sia un unico blob JSON non interrogabile.

## Entità canoniche

- `profiles`: identità principale, preferenze e contatti.
- `family_members`: partner, figli e altre persone; `self` è ammesso solo per importazioni esplicite ed è unico per utente.
- `properties`: abitazioni assicurate con tipo di occupazione e indirizzo.
- `vehicles`: veicoli assicurati con targa e dati essenziali.
- `policies`: contratto personale; conserva compatibilità con `details` e può puntare a persona, immobile o veicolo.
- `policy_members`: relazione molti-a-molti tra polizza e persone, con ruolo.
- `policy_coverages`: fatti di copertura acquistati, con formulazione originale, tipo canonico, stato, limiti, franchigia, provenienza ed evidenza.
- `documents`: archivio documentale con classificazione, lingua e compagnia riconosciuta.
- `opportunities`: segnali persistenti e dismissibili derivati dal portafoglio.
- `consultation_requests`: richiesta esplicita del consumer, con consenso e stato.
- `brokers`, `broker_assignments`, `consultation_events`: modello operativo futuro; non costituisce un portale broker e non espone l'anagrafica broker al consumer.

## Confine relazionale / JSON

Sono relazionali i dati usati per ownership, RLS, deduplicazione, filtri, aggregazioni, storico e collegamenti. Rimangono JSON i dettagli eterogenei della polizza, i termini residui di una copertura e i metadati di estrazione. Tutti i JSON nuovi hanno vincoli di tipo e dimensione.

`policies.details` resta la fonte compatibile per l'interfaccia esistente. La pipeline sincronizza le coperture estratte anche in `policy_coverages`; nessun backfill distruttivo modifica le polizze storiche.

## Copertura canonica

Ogni riga contiene almeno:

- `canonical_type`: concetto ATLAS stabile;
- `original_label`: dicitura esatta dell'assicuratore;
- `insurance_category` e `coverage_status`;
- limite, unità, valuta, franchigia, rimborso percentuale, attesa e territorio quando espliciti;
- `source`, `provenance`, `confidence`, documento, pagina ed evidenza;
- riferimenti opzionali a persona, immobile o veicolo;
- date di validità e `terms` per attributi specialistici residui.

Il catalogo comprende 66 tipi e copre assicurazione di base e complementare, veicoli, mobilia, RC privata, protezione giuridica, viaggio, vita, previdenza 3a/3b, stabile e animali. `other_coverage` conserva senza perdita una dicitura non ancora normalizzata.

## Documenti ed estrazione

Gli 11 tipi documento distinguono polizza, CGA/AVB, condizioni supplementari, fattura, avviso premio, rinnovo, sinistro, riepilogo coperture, informazione cliente, attestato e sconosciuto.

La classificazione deterministica avviene prima dell'estrazione AI. Solo `policy` e `coverage_summary` possono creare una polizza personale. CGA, fatture e materiale informativo vengono archiviati e classificati, ma non diventano prove di una copertura acquistata.

Ogni fatto estratto deve dichiarare `explicit`, `derived` o `unknown`, oltre a confidenza ed evidenza. La knowledge base può normalizzare la terminologia, ma non può trasformare una caratteristica generale di prodotto in un fatto sul cliente.

## RLS e sicurezza

Tutte le entità consumer applicano ownership tramite `auth.uid()`. Le tabelle di collegamento verificano anche l'ownership delle entità referenziate. Due utenti distinti non possono leggere, aggiornare, eliminare o collegare righe altrui.

Il consumer può inserire una richiesta di consulenza solo per sé, con consenso e senza impostare broker o stato operativo. Può leggere solo la propria richiesta e i relativi eventi. `brokers` e `broker_assignments` non sono concessi ai ruoli API consumer. Le funzioni trigger `SECURITY DEFINER` non sono eseguibili direttamente da `public`, `anon` o `authenticated`.

## Strategia migration e compatibilità

Le migration sono additive: creano nuove tabelle, aggiungono colonne nullable, ampliano il check di `policy_type` e mantengono intatti record e JSON esistenti. Le foreign key composte impediscono riferimenti cross-user. Gli indici coprono ownership, stato, categoria, documento e principali access path.

Ordine applicato:

1. household, oggetti assicurati e relazioni;
2. classificazione documenti e coperture canoniche, solo dopo il benchmark svizzero;
3. opportunità e flusso consulenza;
4. hardening dei privilegi delle funzioni trigger.

## Futuro modello commissionale

Il modello attuale non registra commissioni e non presume una remunerazione. In una fase successiva si potranno aggiungere `broker_organizations`, `broker_contracts`, `commission_agreements`, `commission_events` e `commission_disclosures`. Ogni evento dovrà essere append-only, collegato a polizza e incarico, distinguere importo previsto/incassato/stornato, valuta, base di calcolo e disclosure mostrata al cliente. Queste tabelle non devono modificare retroattivamente le richieste di consulenza né essere leggibili dal consumer salvo viste di trasparenza dedicate.

## Base di conoscenza svizzera

La ricerca usa fonti ufficiali federali e pagine/condizioni ufficiali di AXA, Zurich, Helvetia, Allianz Suisse, La Mobiliare, Baloise, Generali, Vaudoise, CSS, Helsana, SWICA, Sanitas, Groupe Mutuel e Visana. Il registro macchina delle 24 fonti è in `lib/insurance-knowledge/insurance-sources.json`.

Limiti noti: i prodotti cambiano nel tempo; le CGA dipendono da edizione e lingua; pagine marketing e condizioni generali non provano l'acquisto individuale; OCR e layout tabellari possono ridurre la precisione. Per questo ATLAS conserva sempre il testo originale e la provenienza, e richiede revisione umana delle bozze AI.
