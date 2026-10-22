"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { requestAccountDeletionAction } from "./deletion-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import {
  NotificationSettingsForm,
  ProfileSettingsPanels,
} from "@/components/settings/ProfileSettingsForms";
import { cn } from "@/lib/utils";
import { IconShield } from "@/components/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const tabs = [
  { id: "profilo", label: "Profilo" },
  { id: "notifiche", label: "Notifiche" },
  { id: "sicurezza", label: "Sicurezza" },
  { id: "preferenze", label: "Preferenze" },
  { id: "fatturazione", label: "Fatturazione" },
  { id: "integrazioni", label: "Integrazioni" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profilo");
  const profile = useCurrentProfile();
  const [deletionFeedback, setDeletionFeedback] = useState<"requested" | "error" | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("deletion");
    if (value === "requested" || value === "error") setDeletionFeedback(value);
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Impostazioni"
        description="Gestisci il tuo account, le preferenze e la sicurezza."
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-medium transition",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "profilo" && <ProfileSettingsPanels profile={profile} />}

      {activeTab === "notifiche" && <NotificationSettingsForm profile={profile} />}

      {activeTab === "sicurezza" && (
        <SectionCard
          title="Sicurezza account"
          action={<StatusBadge variant="neutral" label="In preparazione" />}
        >
          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="text-[13px] font-semibold text-foreground">
              Stato sicurezza non ancora esposto
            </p>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">
              Insura non mostra 2FA, sessioni o cronologia password finche quei dati non sono
              collegati all&apos;account reale.
            </p>
          </div>
        </SectionCard>
      )}

      {activeTab === "fatturazione" && (
        <SectionCard
          title="Fatturazione e abbonamento"
          action={<StatusBadge variant="neutral" label="Non disponibile" />}
        >
          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="text-[13px] font-semibold text-foreground">
              Fatturazione non ancora collegata
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Nessun piano, carta o pagamento demo viene mostrato nelle impostazioni del tuo account.
            </p>
          </div>
        </SectionCard>
      )}

      {activeTab === "integrazioni" && (
        <SectionCard
          title="Integrazioni"
          action={<StatusBadge variant="neutral" label="In preparazione" />}
        >
          <div className="rounded-xl border border-border bg-card-muted p-4">
            <p className="text-[13px] font-semibold text-foreground">
              Nessuna integrazione attiva
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Le connessioni esterne appariranno qui solo quando saranno abilitate per il tuo account.
            </p>
          </div>
        </SectionCard>
      )}

      {activeTab === "preferenze" && (
        <SectionCard title="Aspetto">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card-muted p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Tema visivo</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Scegli tra modalità Giorno e Notte. La preferenza viene salvata su questo
                dispositivo.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </SectionCard>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconShield className="h-5 w-5 text-accent" />
          <p className="text-[12px] text-muted-foreground">
            I documenti sono archiviati in uno spazio privato con controllo di accesso. Per i dettagli sul trattamento consulta le informazioni sulla privacy; la verifica di sicurezza è ancora in corso.
          </p>
        </div>
        <StatusBadge variant="neutral" label="Dettagli in preparazione" />
      </div>

      <SectionCard title="Scadenze e attività">
        <div className="flex flex-wrap gap-3"><Link href="/reminders" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-accent">Vedi scadenze</Link><Link href="/activity" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-accent">Errori e attività</Link></div>
      </SectionCard>

      {deletionFeedback && <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">{deletionFeedback === "requested" ? "Richiesta di cancellazione registrata. L’account rimane attivo fino al completamento della procedura." : "Non è stato possibile registrare la richiesta. Riprova."}</p>}
      <SectionCard title="Dati e account">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-foreground">Esporta i tuoi dati</p>
              <p className="text-[11px] text-muted">
                Scarica un archivio JSON con profilo, polizze, metadati documenti, conversazioni AI e correzioni. I PDF originali si scaricano dalla sezione Documenti.
              </p>
            </div>
            <a href="/api/account/export" download="insura-dati.json" className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white">Esporta JSON</a>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border atlas-alert-danger p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium">Elimina account</p>
              <p className="text-[11px] opacity-90">
                Invia una richiesta autenticata di cancellazione. La richiesta viene registrata per verifica e gestione; i dati non vengono eliminati immediatamente.
              </p>
            </div>
            <form action={requestAccountDeletionAction} onSubmit={(event) => { if (!window.confirm("Confermi la richiesta di cancellazione del tuo account INSURA? I dati non saranno eliminati immediatamente.")) event.preventDefault(); }}><button type="submit" className="rounded-lg border border-red-400 px-4 py-2 text-xs font-semibold text-red-700">Richiedi cancellazione</button></form>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
