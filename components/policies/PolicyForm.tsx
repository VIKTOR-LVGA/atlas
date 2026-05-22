"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createPolicyAction,
  type PolicyActionState,
  updatePolicyAction,
} from "@/app/(app)/policies/actions";
import type { UserDocument, UserPolicy } from "@/lib/types";
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

export function PolicyForm({
  documents,
  policy,
  selectedDocumentId = null,
}: PolicyFormProps) {
  const action = policy
    ? updatePolicyAction.bind(null, policy.id)
    : createPolicyAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const defaultDocumentId = policy?.documentId ?? selectedDocumentId ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <input
            id="policy-type"
            name="policy_type"
            required
            defaultValue={policy?.policyType ?? ""}
            placeholder="Es. RC privata"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <FieldError>{state.fieldErrors?.policyType}</FieldError>
        </div>
        <div>
          <label htmlFor="policy-premium" className="text-[11px] font-medium text-slate-600">
            Premio
          </label>
          <input
            id="policy-premium"
            name="premium_amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={policy?.premiumAmount ?? ""}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <FieldError>{state.fieldErrors?.premiumAmount}</FieldError>
        </div>
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
          <label htmlFor="policy-deductible" className="text-[11px] font-medium text-slate-600">
            Franchigia
          </label>
          <input
            id="policy-deductible"
            name="deductible"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={policy?.deductible ?? ""}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <FieldError>{state.fieldErrors?.deductible}</FieldError>
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
          {state.message || "I campi premio, franchigia e rinnovo possono restare vuoti."}
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
