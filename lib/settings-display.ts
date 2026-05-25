export type SettingsLockedModule = {
  id: string;
  label: string;
  description: string;
  futureDetail: string;
};

export const settingsLockedModules: SettingsLockedModule[] = [
  {
    id: "billing",
    label: "Abbonamento e fatturazione",
    description: "Gestione piano, fatture e metodi di pagamento.",
    futureDetail: "Nessun piano o carta demo — attivo quando il billing sarà collegato.",
  },
  {
    id: "sessions",
    label: "Sessioni attive",
    description: "Dispositivi collegati e revoca accessi.",
    futureDetail: "Cronologia sessioni reale, non simulata.",
  },
  {
    id: "export",
    label: "Esportazione dati",
    description: "Scarica polizze e documenti in formato strutturato.",
    futureDetail: "Export su richiesta quando il flusso sarà disponibile.",
  },
  {
    id: "integrations",
    label: "Integrazioni",
    description: "Connessioni con servizi esterni autorizzati.",
    futureDetail: "Solo integrazioni realmente abilitate per il tuo account.",
  },
  {
    id: "privacy-advanced",
    label: "Privacy avanzata",
    description: "Preferenze granulari su conservazione e condivisione.",
    futureDetail: "Controlli aggiuntivi oltre al profilo base.",
  },
];

export type SettingsCapability = {
  id: string;
  label: string;
  status: "active" | "saved" | "preparing" | "local";
  detail: string;
};

export const settingsCapabilities: SettingsCapability[] = [
  {
    id: "profile",
    label: "Profilo e contatti",
    status: "active",
    detail: "Nome, telefono, email (sola lettura da accesso)",
  },
  {
    id: "locale",
    label: "Lingua, valuta e date",
    status: "saved",
    detail: "Salvati su Supabase — CHF e formati data",
  },
  {
    id: "notifications",
    label: "Notifiche",
    status: "saved",
    detail: "Preferenze salvate; canali push/SMS in rollout",
  },
  {
    id: "theme",
    label: "Tema Giorno / Notte",
    status: "local",
    detail: "Salvato su questo dispositivo",
  },
];
