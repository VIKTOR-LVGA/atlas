"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createPolicyAction,
  type PolicyActionState,
  updatePolicyAction,
} from "@/app/(app)/policies/actions";
import { policyTypeLabels, typedPolicyTypes } from "@/lib/policy-types";
import type {
  PolicyDetails,
  TypedPolicyType,
  UserDocument,
  UserPolicy,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: PolicyActionState = {
  status: "idle",
  message: "",
};

const premiumFrequencyOptions = [
  { label: "Mensile", value: "monthly" },
  { label: "Trimestrale", value: "quarterly" },
  { label: "Semestrale", value: "semiannual" },
  { label: "Annuale", value: "annual" },
] as const;

interface PolicyFormProps {
  documents: UserDocument[];
  policy?: UserPolicy;
  selectedDocumentId?: string | null;
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1 text-[11px] text-red-600">{children}</p> : null;
}

function TextField({
  id,
  label,
  name,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  name,
  defaultValue,
  placeholder = "0",
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: number | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function CheckboxField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
      <span>
        <span className="block text-[12px] font-medium text-slate-900">
          {label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
      />
    </label>
  );
}

function TypeDetailsFields({
  policyType,
  details,
}: {
  policyType: TypedPolicyType;
  details: PolicyDetails;
}) {
  switch (policyType) {
    case "health":
      return (
        <>
          <NumberField
            id="policy-health-franchise"
            label="Franchise cassa malati"
            name="detail_franchise"
            defaultValue={details.franchise}
            placeholder="300"
          />
          <TextField
            id="policy-health-model"
            label="Modello"
            name="detail_model"
            defaultValue={details.model}
            placeholder="Standard, HMO, Telmed..."
          />
          <TextField
            id="policy-health-hospital"
            label="Copertura ospedaliera"
            name="detail_hospital_coverage"
            defaultValue={details.hospital_coverage}
            placeholder="Comune Svizzera"
          />
          <CheckboxField
            name="detail_complementary"
            label="Complementare"
            description="La polizza include una copertura complementare."
            defaultChecked={details.complementary}
          />
        </>
      );
    case "car":
      return (
        <>
          <TextField
            id="policy-car-plate"
            label="Targa"
            name="detail_plate_number"
            defaultValue={details.plate_number}
            placeholder="ZH 123456"
          />
          <TextField
            id="policy-car-casco"
            label="Casco"
            name="detail_casco"
            defaultValue={details.casco}
            placeholder="Totale, parziale, nessuna"
          />
          <TextField
            id="policy-car-bonus"
            label="Bonus malus"
            name="detail_bonus_malus"
            defaultValue={details.bonus_malus}
            placeholder="Livello 35%"
          />
          <NumberField
            id="policy-car-km"
            label="Km annui"
            name="detail_annual_km"
            defaultValue={details.annual_km}
            placeholder="12000"
          />
        </>
      );
    case "household":
      return (
        <>
          <NumberField
            id="policy-household-sum"
            label="Somma assicurata"
            name="detail_insured_sum"
            defaultValue={details.insured_sum}
            placeholder="80000"
          />
          <CheckboxField
            name="detail_glass_coverage"
            label="Copertura vetri"
            description="Danni a vetri e superfici fragili inclusi."
            defaultChecked={details.glass_coverage}
          />
          <CheckboxField
            name="detail_theft_coverage"
            label="Copertura furto"
            description="Furto domestico o fuori casa indicato nella polizza."
            defaultChecked={details.theft_coverage}
          />
        </>
      );
    case "liability":
      return (
        <>
          <NumberField
            id="policy-liability-limit"
            label="Limite RC"
            name="detail_liability_limit"
            defaultValue={details.liability_limit}
            placeholder="5000000"
          />
          <NumberField
            id="policy-liability-members"
            label="Membri nucleo inclusi"
            name="detail_household_members_included"
            defaultValue={details.household_members_included}
            placeholder="2"
          />
        </>
      );
    case "legal":
      return (
        <>
          <CheckboxField
            name="detail_private_legal"
            label="Giuridica privata"
            description="Controversie private coperte."
            defaultChecked={details.private_legal}
          />
          <CheckboxField
            name="detail_traffic_legal"
            label="Giuridica traffico"
            description="Controversie legate alla circolazione incluse."
            defaultChecked={details.traffic_legal}
          />
          <TextField
            id="policy-legal-region"
            label="Regione coperta"
            name="detail_coverage_region"
            defaultValue={details.coverage_region}
            placeholder="Svizzera ed Europa"
          />
        </>
      );
    default:
      return (
        <div className="sm:col-span-2">
          <label
            htmlFor="policy-other-details"
            className="text-[11px] font-medium text-slate-600"
          >
            Dettagli aggiuntivi
          </label>
          <textarea
            id="policy-other-details"
            name="detail_generic_details"
            rows={4}
            defaultValue={details.generic_details ?? ""}
            placeholder="Campi o coperture specifiche da ricordare."
            className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      );
  }
}

export function PolicyForm({
  documents,
  policy,
  selectedDocumentId = null,
}: PolicyFormProps) {
  const action = policy
    ? updatePolicyAction.bind(null, policy.id)
    : createPolicyAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [policyType, setPolicyType] = useState<TypedPolicyType>(
    policy?.policyType ?? "other"
  );
  const defaultDocumentId = policy?.documentId ?? selectedDocumentId ?? "";
  const details = policy?.policyType === policyType ? policy.details : {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
        <p className="text-[12px] font-semibold text-slate-900">Dati comuni</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="policy-provider" className="text-[11px] font-medium text-slate-600">
              Compagnia
            </label>
            <input
              id="policy-provider"
              name="provider"
              required
              defaultValue={policy?.provider ?? ""}
              placeholder="Es. Helsana"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError>{state.fieldErrors?.provider}</FieldError>
          </div>
          <div>
            <label htmlFor="policy-type" className="text-[11px] font-medium text-slate-600">
              Tipo polizza
            </label>
            <select
              id="policy-type"
              name="policy_type"
              value={policyType}
              onChange={(event) =>
                setPolicyType(event.target.value as TypedPolicyType)
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {typedPolicyTypes.map((type) => (
                <option key={type} value={type}>
                  {policyTypeLabels[type]}
                </option>
              ))}
            </select>
            <FieldError>{state.fieldErrors?.policyType}</FieldError>
          </div>
          {policyType === "other" && (
            <div>
              <label
                htmlFor="policy-category-label"
                className="text-[11px] font-medium text-slate-600"
              >
                Etichetta categoria
              </label>
              <input
                id="policy-category-label"
                name="policy_category_label"
                defaultValue={policy?.policyCategoryLabel ?? ""}
                placeholder="Es. Viaggio"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <TextField
            id="policy-number"
            label="Numero polizza"
            name="policy_number"
            defaultValue={policy?.policyNumber}
            placeholder="Numero o riferimento"
          />
          <NumberField
            id="policy-premium"
            label="Premio"
            name="premium_amount"
            defaultValue={policy?.premiumAmount}
            placeholder="0.00"
          />
          <div>
            <label htmlFor="policy-frequency" className="text-[11px] font-medium text-slate-600">
              Frequenza premio
            </label>
            <select
              id="policy-frequency"
              name="premium_frequency"
              defaultValue={policy?.premiumFrequency ?? "monthly"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {premiumFrequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{state.fieldErrors?.premiumFrequency}</FieldError>
          </div>
          <div>
            <label htmlFor="policy-currency" className="text-[11px] font-medium text-slate-600">
              Valuta
            </label>
            <select
              id="policy-currency"
              name="currency"
              defaultValue={policy?.currency ?? "CHF"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="CHF">CHF</option>
            </select>
            <FieldError>{state.fieldErrors?.currency}</FieldError>
          </div>
          <NumberField
            id="policy-deductible"
            label="Franchigia / scoperto"
            name="deductible"
            defaultValue={policy?.deductible}
            placeholder="0.00"
          />
          <NumberField
            id="policy-coverage"
            label="Somma copertura"
            name="coverage_amount"
            defaultValue={policy?.coverageAmount}
            placeholder="0.00"
          />
          <div>
            <label htmlFor="policy-start" className="text-[11px] font-medium text-slate-600">
              Data inizio
            </label>
            <input
              id="policy-start"
              name="start_date"
              type="date"
              defaultValue={policy?.startDate ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError>{state.fieldErrors?.startDate}</FieldError>
          </div>
          <div>
            <label htmlFor="policy-end" className="text-[11px] font-medium text-slate-600">
              Data fine
            </label>
            <input
              id="policy-end"
              name="end_date"
              type="date"
              defaultValue={policy?.endDate ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError>{state.fieldErrors?.endDate}</FieldError>
          </div>
          <div>
            <label htmlFor="policy-renewal" className="text-[11px] font-medium text-slate-600">
              Data rinnovo
            </label>
            <input
              id="policy-renewal"
              name="renewal_date"
              type="date"
              defaultValue={policy?.renewalDate ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <FieldError>{state.fieldErrors?.renewalDate}</FieldError>
          </div>
        </div>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          <FieldError>{state.fieldErrors?.premiumAmount}</FieldError>
          <FieldError>{state.fieldErrors?.deductible}</FieldError>
          <FieldError>{state.fieldErrors?.coverageAmount}</FieldError>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-semibold text-slate-900">
              Dettagli {policyTypeLabels[policyType]}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Campi specifici per questa categoria.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TypeDetailsFields policyType={policyType} details={details} />
        </div>
        <FieldError>{state.fieldErrors?.details}</FieldError>
      </div>

      <div>
        <label htmlFor="policy-document" className="text-[11px] font-medium text-slate-600">
          Documento PDF collegato
        </label>
        <select
          id="policy-document"
          name="document_id"
          defaultValue={defaultDocumentId}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Nessun documento collegato</option>
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.fileName}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-slate-500">
          Il PDF resta nel tuo archivio privato e puo alimentare l&apos;analisi in seguito.
        </p>
      </div>

      <div>
        <label htmlFor="policy-notes" className="text-[11px] font-medium text-slate-600">
          Note
        </label>
        <textarea
          id="policy-notes"
          name="notes"
          rows={5}
          defaultValue={policy?.notes ?? ""}
          placeholder="Dettagli utili, coperture da verificare o promemoria."
          className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={cn(
            "text-[12px]",
            state.status === "error" ? "text-red-600" : "text-slate-500"
          )}
        >
          {state.message || "I campi opzionali possono restare vuoti."}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={policy ? `/policies/${policy.id}` : "/policies"}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-300"
          >
            {pending
              ? "Salvataggio..."
              : policy
                ? "Salva polizza"
                : "Crea polizza"}
          </button>
        </div>
      </div>
    </form>
  );
}
