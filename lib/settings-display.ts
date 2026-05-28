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
    futureDetail: "Attivo quando il billing sarà collegato.",
  },
  {
    id: "sessions",
    label: "Sessioni attive",
    description: "Dispositivi collegati e revoca accessi.",
    futureDetail: "Cronologia sessioni e dispositivi collegati.",
  },
  {
    id: "integrations",
    label: "Integrazioni",
    description: "Connessioni con servizi esterni autorizzati.",
    futureDetail: "Solo integrazioni realmente abilitate per il tuo account.",
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
    detail: "Salvati sul profilo — CHF e formati data",
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
  {
    id: "export",
    label: "Esportazione dati",
    status: "active",
    detail: "JSON strutturato e CSV polizze dal tuo account",
  },
  {
    id: "data-control",
    label: "Controllo dati",
    status: "active",
    detail: "Export, rimozione portfolio e richiesta chiusura profilo",
  },
];
