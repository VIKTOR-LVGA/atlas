"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LinkAction } from "@/components/ui/LinkAction";
import { userProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  IconShield,
  IconChevronRight,
} from "@/components/icons";

const tabs = [
  { id: "profilo", label: "Profilo" },
  { id: "notifiche", label: "Notifiche" },
  { id: "sicurezza", label: "Sicurezza" },
  { id: "preferenze", label: "Preferenze" },
  { id: "fatturazione", label: "Fatturazione" },
  { id: "integrazioni", label: "Integrazioni" },
];

const integrations = [
  "Google Drive",
  "Google Calendar",
  "Apple Calendar",
  "Microsoft Outlook",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profilo");

  return (
    <div className="space-y-5">
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

      {activeTab === "profilo" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Informazioni profilo">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="text-center sm:text-left">
                <div className="relative mx-auto h-24 w-24 sm:mx-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-semibold text-white">
                    MB
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-600"
                  >
                    📷
                  </button>
                </div>
                <p className="mt-3 text-[14px] font-semibold text-slate-900">{userProfile.name}</p>
                <StatusBadge variant="ok" label="Account verificato" className="mt-1" />
                <p className="mt-1 text-[11px] text-slate-500">
                  Membro dal {formatDate(userProfile.memberSince)}
                </p>
              </div>
              <form className="grid flex-1 gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                {[
                  { l: "Nome", v: "Marco" },
                  { l: "Cognome", v: "Bianchi" },
                  { l: "Email", v: userProfile.email },
                  { l: "Telefono", v: "+41 79 000 00 00" },
                ].map((f) => (
                  <div key={f.l}>
                    <label className="text-[11px] font-medium text-slate-600">{f.l}</label>
                    <input
                      type="text"
                      defaultValue={f.v}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ))}
                <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                  <button type="button" className="rounded-lg px-4 py-2 text-[13px] text-slate-600">
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
                  >
                    Salva modifiche
                  </button>
                </div>
              </form>
            </div>
          </SectionCard>

          <SectionCard title="Lingua e regione">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { l: "Lingua", v: "Italiano" },
                { l: "Valuta", v: "CHF" },
                { l: "Formato data", v: "GG/MM/AAAA" },
                { l: "Fuso orario", v: "Europe/Zurich" },
              ].map((f) => (
                <div key={f.l}>
                  <label className="text-[11px] font-medium text-slate-600">{f.l}</label>
                  <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px]">
                    <option>{f.v}</option>
                  </select>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white"
            >
              Salva preferenze
            </button>
          </SectionCard>
        </div>
      )}

      {activeTab === "notifiche" && (
        <SectionCard title="Preferenze notifiche">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] uppercase text-slate-400">
                <th className="pb-2 text-left">Tipo</th>
                <th className="pb-2 text-center">Email</th>
                <th className="pb-2 text-center">Push</th>
                <th className="pb-2 text-center">SMS</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Aggiornamenti polizze",
                "Nuova analisi completata",
                "Scadenze imminenti",
                "Raccomandazioni",
              ].map((row) => (
                <tr key={row} className="border-b border-slate-50">
                  <td className="py-3 text-slate-800">{row}</td>
                  {["email", "push", "sms"].map((ch) => (
                    <td key={ch} className="py-3 text-center">
                      <input
                        type="checkbox"
                        defaultChecked={ch !== "sms"}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white">
              Salva preferenze
            </button>
          </div>
        </SectionCard>
      )}

      {activeTab === "sicurezza" && (
        <SectionCard title="Sicurezza account">
          <ul className="divide-y divide-slate-50">
            {[
              { t: "Autenticazione a due fattori", s: "Attivo", badge: "ok" as const },
              { t: "Password", s: "Ultima modifica 3 mesi fa", badge: null },
              { t: "Sessioni attive", s: "2 dispositivi", badge: null },
            ].map((item) => (
              <li key={item.t} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[13px] font-medium text-slate-900">{item.t}</p>
                  <p className="text-[11px] text-slate-500">{item.s}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && <StatusBadge variant={item.badge} />}
                  <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700">
                    Gestisci
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {activeTab === "fatturazione" && (
        <SectionCard title="Fatturazione e abbonamento">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-100 p-4">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Premium Mensile</p>
              <p className="text-[12px] text-slate-500">CHF 29.00 / mese</p>
            </div>
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium">
              Gestisci abbonamento
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">VISA</span>
              <span className="text-[13px] text-slate-700">•••• 4242</span>
            </div>
            <LinkAction href="#">Modifica</LinkAction>
          </div>
        </SectionCard>
      )}

      {activeTab === "integrazioni" && (
        <SectionCard title="Integrazioni">
          <ul className="divide-y divide-slate-50">
            {integrations.map((name) => (
              <li key={name} className="flex items-center justify-between py-3">
                <span className="text-[13px] text-slate-800">{name}</span>
                <button type="button" className="rounded-lg border border-blue-200 px-3 py-1.5 text-[12px] font-medium text-blue-700">
                  Connetti
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {activeTab === "preferenze" && (
        <SectionCard title="Preferenze generali">
          {[
            { l: "Modalità chiara", on: true },
            { l: "Suggerimenti contestuali", on: true },
            { l: "Condividi dati di utilizzo", on: false },
          ].map((pref) => (
            <div key={pref.l} className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
              <span className="text-[13px] text-slate-700">{pref.l}</span>
              <button
                type="button"
                className={cn(
                  "relative h-5 w-9 rounded-full transition",
                  pref.on ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                    pref.on ? "left-4" : "left-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </SectionCard>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <IconShield className="h-5 w-5 text-blue-600" />
          <p className="text-[12px] text-slate-700">
            I tuoi dati sono protetti con crittografia e hosting in Svizzera.
          </p>
        </div>
        <button type="button" className="flex items-center gap-1 text-[12px] font-medium text-blue-600">
          Scopri le nostre misure di sicurezza
          <IconChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <SectionCard title="Dati e account">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-900">Esporta i tuoi dati</p>
              <p className="text-[11px] text-slate-500">JSON con polizze, analisi e documenti</p>
            </div>
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium">
              Esporta
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-red-900">Elimina account</p>
              <p className="text-[11px] text-red-700/80">Azione irreversibile</p>
            </div>
            <button type="button" className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[12px] font-medium text-red-700">
              Elimina account
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
