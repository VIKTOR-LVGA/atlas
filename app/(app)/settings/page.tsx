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

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-medium transition",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
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
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
            <p className="text-[13px] font-semibold text-slate-900">
              Stato sicurezza non ancora esposto
            </p>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-500">
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
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
            <p className="text-[13px] font-semibold text-slate-900">
              Fatturazione non ancora collegata
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
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
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
            <p className="text-[13px] font-semibold text-slate-900">
              Nessuna integrazione attiva
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Le connessioni esterne appariranno qui solo quando saranno abilitate per il tuo account.
            </p>
          </div>
        </SectionCard>
      )}

      {activeTab === "preferenze" && (
        <SectionCard
          title="Preferenze generali"
          action={<StatusBadge variant="neutral" label="In preparazione" />}
        >
          <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
            <p className="text-[13px] font-semibold text-slate-900">
              Preferenze aggiuntive in arrivo
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Lingua, formato data e notifiche reali sono gia gestiti nelle schede profilo e
              notifiche.
            </p>
          </div>
        </SectionCard>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconShield className="h-5 w-5 text-blue-600" />
          <p className="text-[12px] text-slate-700">
            I tuoi dati sono protetti con crittografia e hosting in Svizzera.
          </p>
        </div>
        <StatusBadge variant="neutral" label="Dettagli in preparazione" />
      </div>

      <SectionCard title="Dati e account">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-900">Esporta i tuoi dati</p>
              <p className="text-[11px] text-slate-500">
                Esportazione non ancora disponibile.
              </p>
            </div>
            <StatusBadge variant="neutral" label="In preparazione" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-red-900">Elimina account</p>
              <p className="text-[11px] text-red-700/80">
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
