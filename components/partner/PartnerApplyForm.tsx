"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  submitPartnerApplicationAction,
  type PartnerApplyState,
} from "@/app/partner/apply/actions";
import { operationsButton, operationsInput } from "@/components/operations/OperationsUi";

const initial: PartnerApplyState = { status: "idle", message: "" };

export function PartnerApplyForm({
  cantonOptions,
  defaults,
}: {
  cantonOptions: Array<{ value: string; label: string }>;
  defaults: {
    firstName: string;
    lastName: string;
    organizationName: string;
    professionalEmail: string;
    primaryCanton: string;
    servedCantons: string[];
    languages: string[];
  } | null;
}) {
  const [state, action, pending] = useActionState(submitPartnerApplicationAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[11px] text-muted">
          Nome
          <input
            required
            name="first_name"
            defaultValue={defaults?.firstName}
            className={operationsInput}
          />
        </label>
        <label className="text-[11px] text-muted">
          Cognome
          <input
            required
            name="last_name"
            defaultValue={defaults?.lastName}
            className={operationsInput}
          />
        </label>
        <label className="text-[11px] text-muted">
          Società
          <input
            name="organization_name"
            defaultValue={defaults?.organizationName}
            className={operationsInput}
          />
        </label>
        <label className="text-[11px] text-muted">
          Ragione sociale
          <input name="legal_name" className={operationsInput} />
        </label>
        <label className="text-[11px] text-muted">
          Email professionale
          <input
            required
            type="email"
            name="professional_email"
            defaultValue={defaults?.professionalEmail}
            className={operationsInput}
          />
        </label>
        <label className="text-[11px] text-muted">
          Telefono
          <input required name="phone" className={operationsInput} placeholder="+41 ..." />
        </label>
        <label className="text-[11px] text-muted">
          Sito web
          <input name="website" className={operationsInput} placeholder="https://" />
        </label>
        <label className="text-[11px] text-muted">
          Tipo partner
          <select
            name="partner_type"
            defaultValue="independent_broker"
            className={operationsInput}
          >
            <option value="independent_broker">Broker indipendente</option>
            <option value="brokerage_company">Società di brokeraggio</option>
            <option value="agency">Agenzia</option>
            <option value="general_agent">Agente generale</option>
            <option value="other">Altro</option>
          </select>
        </label>
        <label className="text-[11px] text-muted">
          Cantone principale
          <select
            required
            name="primary_canton"
            defaultValue={defaults?.primaryCanton ?? ""}
            className={operationsInput}
          >
            <option value="">Seleziona</option>
            {cantonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-muted">
          Identificativo professionale
          <input name="professional_id" className={operationsInput} />
        </label>
      </div>

      <fieldset>
        <legend className="text-[11px] font-semibold text-foreground">Cantoni serviti</legend>
        <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {cantonOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-[11px] text-muted">
              <input
                type="checkbox"
                name="served_cantons"
                value={option.value}
                defaultChecked={defaults?.servedCantons.includes(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-semibold text-foreground">Lingue</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
          {[
            ["it", "Italiano"],
            ["de", "Deutsch"],
            ["fr", "Français"],
            ["en", "English"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="languages"
                value={value}
                defaultChecked={defaults?.languages.includes(value) ?? value === "it"}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-[11px] text-muted">
        Esperienza
        <textarea name="experience_notes" rows={3} className={operationsInput} />
      </label>
      <label className="block text-[11px] text-muted">
        Messaggio
        <textarea name="message" rows={3} className={operationsInput} />
      </label>

      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <input required name="consent" type="checkbox" className="mt-0.5" />
        Acconsento al trattamento dei dati della candidatura per la valutazione da parte di
        ATLAS. Il consenso non è preselezionato.
      </label>
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <input required name="terms" type="checkbox" className="mt-0.5" />
        Accetto le{" "}
        <Link href="/terms#partner" className="font-medium text-accent hover:text-accent-hover">
          condizioni Partner ATLAS
        </Link>
        .
      </label>
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <input required name="accuracy_declared" type="checkbox" className="mt-0.5" />
        Dichiaro che le informazioni professionali fornite sono corrette e aggiornate.
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-[12px] text-[var(--danger-text)]">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button disabled={pending} className={operationsButton}>
          {pending ? "Invio…" : "Invia candidatura"}
        </button>
        <Link href="/partner" className="text-[12px] text-muted hover:text-foreground">
          Torna alla pagina partner
        </Link>
      </div>
    </form>
  );
}
