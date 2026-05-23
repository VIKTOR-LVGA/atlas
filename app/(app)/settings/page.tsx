"use client";

import { useState } from "react";
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
              Atlas non mostra 2FA, sessioni o cronologia password finche quei dati non sono
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
            I tuoi dati sono protetti con crittografia e hosting in Svizzera.
          </p>
        </div>
        <StatusBadge variant="neutral" label="Dettagli in preparazione" />
      </div>

      <SectionCard title="Dati e account">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-foreground">Esporta i tuoi dati</p>
              <p className="text-[11px] text-muted">
                Esportazione non ancora disponibile.
              </p>
            </div>
            <StatusBadge variant="neutral" label="In preparazione" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border atlas-alert-danger p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium">Elimina account</p>
              <p className="text-[11px] opacity-90">
                Flusso eliminazione non ancora disponibile.
              </p>
            </div>
            <StatusBadge variant="neutral" label="In preparazione" />
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
