"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  createPolicyAction,
  type PolicyActionState,
} from "@/app/(app)/policies/actions";
import {
  TypeDetailsFields,
} from "@/components/policies/PolicyForm";
import { visualPolicyCategories, type VisualPolicyCategoryId } from "@/lib/policy-visual-categories";
import { premiumFrequencyLongLabels } from "@/lib/premium-totals";
import { policyTypeLabels } from "@/lib/policy-types";
import type { TypedPolicyType, UserDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: PolicyActionState = {
  status: "idle",
  message: "",
};

const steps = [
  "Che assicurazione vuoi aggiungere?",
  "Compagnia",
  "Costo",
  "Date",
  "Dettagli",
  "Documento",
  "Riepilogo",
] as const;

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-input px-3 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

function FieldError({ children }: { children?: string }) {
  return children ? (
    <p className="mt-1 text-[12px] text-[var(--danger-text)]">{children}</p>
  ) : null;
}

export function PolicyCreateWizard({
  documents,
  selectedDocumentId = null,
}: {
  documents: UserDocument[];
  selectedDocumentId?: string | null;
}) {
  const [state, formAction, pending] = useActionState(createPolicyAction, initialState);
  const [step, setStep] = useState(0);
  const [visualId, setVisualId] = useState<VisualPolicyCategoryId>("health");
  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "semiannual" | "annual">(
    "annual"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [notes, setNotes] = useState("");
  const [documentId, setDocumentId] = useState(selectedDocumentId ?? "");
  const [customLabel, setCustomLabel] = useState("");

  const category = visualPolicyCategories.find((item) => item.id === visualId)!;
  const policyType: TypedPolicyType = category.typedType;
  const categoryLabel =
    policyType === "other"
      ? visualId === "other"
        ? customLabel.trim() || null
        : category.categoryLabel
      : null;

  const canAdvance = useMemo(() => {
    if (step === 1) {
      return provider.trim().length > 0;
    }
    return true;
  }, [provider, step]);

  const lastStep = steps.length - 1;
  const canSaveDraft = provider.trim().length > 0;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="policy_type" value={policyType} />
      <input type="hidden" name="policy_category_label" value={categoryLabel ?? ""} />
      <input type="hidden" name="currency" value="CHF" />

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Passo {step + 1} di {steps.length}
        </p>
        <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
          {steps[step]}
        </h2>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-card-muted">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div hidden={step !== 0} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visualPolicyCategories.map((item) => {
          const selected = item.id === visualId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setVisualId(item.id)}
              className={cn(
                "atlas-consumer-press min-h-[5.5rem] rounded-2xl border px-3 py-3 text-left",
                selected
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
              aria-pressed={selected}
            >
              <span className="block text-[13px] font-semibold text-foreground">{item.label}</span>
              <span className="mt-1 block text-[11px] leading-snug text-muted">{item.hint}</span>
            </button>
          );
        })}
        {visualId === "other" ? (
          <div className="col-span-2 sm:col-span-3">
            <label htmlFor="wizard-category-label" className="text-[12px] font-medium text-muted">
              Nome categoria
            </label>
            <input
              id="wizard-category-label"
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="Es. Moto, barca..."
              className={inputClass}
            />
          </div>
        ) : null}
      </div>

      <div hidden={step !== 1} className="space-y-4">
        <div>
          <label htmlFor="policy-provider" className="text-[12px] font-medium text-muted">
            Compagnia
          </label>
          <input
            id="policy-provider"
            name="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            placeholder="Nome della compagnia"
            className={inputClass}
          />
          <FieldError>{state.fieldErrors?.provider}</FieldError>
        </div>
        <div>
          <label htmlFor="policy-number" className="text-[12px] font-medium text-muted">
            Numero polizza
          </label>
          <input
            id="policy-number"
            name="policy_number"
            value={policyNumber}
            onChange={(event) => setPolicyNumber(event.target.value)}
            placeholder="Opzionale"
            className={inputClass}
          />
        </div>
      </div>

      <div hidden={step !== 2} className="space-y-4">
        <div>
          <label htmlFor="policy-premium" className="text-[12px] font-medium text-muted">
            Premio
          </label>
          <input
            id="policy-premium"
            name="premium_amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={premiumAmount}
            onChange={(event) => setPremiumAmount(event.target.value)}
            placeholder="Opzionale"
            className={inputClass}
          />
          <FieldError>{state.fieldErrors?.premiumAmount}</FieldError>
        </div>
        <div>
          <label htmlFor="policy-frequency" className="text-[12px] font-medium text-muted">
            Frequenza premio
          </label>
          <select
            id="policy-frequency"
            name="premium_frequency"
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value as typeof frequency)
            }
            className={inputClass}
          >
            <option value="monthly">Mensile</option>
            <option value="quarterly">Trimestrale</option>
            <option value="semiannual">Semestrale</option>
            <option value="annual">Annuale</option>
          </select>
        </div>
      </div>

      <div hidden={step !== 3} className="space-y-4">
        <div>
          <label htmlFor="policy-start" className="text-[12px] font-medium text-muted">
            Data inizio
          </label>
          <input
            id="policy-start"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="policy-end" className="text-[12px] font-medium text-muted">
            Data fine
          </label>
          <input
            id="policy-end"
            name="end_date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="policy-renewal" className="text-[12px] font-medium text-muted">
            Data rinnovo
          </label>
          <input
            id="policy-renewal"
            name="renewal_date"
            type="date"
            value={renewalDate}
            onChange={(event) => setRenewalDate(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div hidden={step !== 4} className="space-y-4">
        <div className="grid gap-3" key={policyType}>
          <TypeDetailsFields policyType={policyType} details={{}} />
        </div>
        <div>
          <label htmlFor="policy-notes" className="text-[12px] font-medium text-muted">
            Note personali
          </label>
          <textarea
            id="policy-notes"
            name="notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opzionale"
            className={inputClass}
          />
        </div>
      </div>

      <div hidden={step !== 5} className="space-y-3">
        <p className="text-[13px] leading-relaxed text-muted">
          Puoi collegare un PDF già caricato oppure saltare e completare dopo.
        </p>
        <div>
          <label htmlFor="policy-document" className="text-[12px] font-medium text-muted">
            Documento PDF collegato
          </label>
          <select
            id="policy-document"
            name="document_id"
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            className={inputClass}
          >
            <option value="">Nessun documento collegato</option>
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.fileName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div hidden={step !== 6} className="atlas-consumer-card space-y-3 px-4 py-4 text-[13px]">
        <SummaryRow label="Tipo" value={category.label} />
        <SummaryRow label="Compagnia" value={provider || "Da completare"} />
        <SummaryRow label="Numero" value={policyNumber || "Non indicato"} />
        <SummaryRow
          label="Premio"
          value={
            premiumAmount
              ? `CHF ${premiumAmount} / ${premiumFrequencyLongLabels[frequency].toLowerCase()}`
              : "Non indicato"
          }
        />
        <SummaryRow label="Inizio" value={startDate || "Non indicato"} />
        <SummaryRow label="Scadenza" value={endDate || "Non indicato"} />
        <SummaryRow label="Rinnovo" value={renewalDate || "Non indicato"} />
        <SummaryRow
          label="Documento"
          value={
            documents.find((document) => document.id === documentId)?.fileName ?? "Non collegato"
          }
        />
        <p className="pt-2 text-[12px] text-muted">
          Categoria tecnica: {policyTypeLabels[policyType]}
        </p>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-[13px] text-[var(--danger-text)]">
          {state.message}
        </p>
      ) : (
        <p className="text-[12px] text-muted">{state.message || "Puoi lasciare i campi opzionali vuoti."}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            className="atlas-btn-secondary min-h-11 flex-1 px-4 text-[13px]"
          >
            Indietro
          </button>
        ) : (
          <Link href="/policies" className="atlas-btn-secondary min-h-11 flex-1 px-4 text-center text-[13px]">
            Annulla
          </Link>
        )}

        {step < lastStep ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((value) => Math.min(lastStep, value + 1))}
            className="atlas-btn-primary min-h-11 flex-1 px-4 text-[13px] disabled:opacity-50"
          >
            Continua
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending || !canSaveDraft}
            className="atlas-btn-primary min-h-11 flex-1 px-4 text-[13px] disabled:opacity-50"
          >
            {pending ? "Salvataggio..." : "Crea polizza"}
          </button>
        )}
      </div>

      {step > 0 && step < lastStep ? (
        <button
          type="submit"
          disabled={pending || !canSaveDraft}
          className="w-full min-h-11 rounded-xl px-4 text-[13px] font-medium text-muted hover:text-foreground disabled:opacity-50"
        >
          Salva e completa dopo
        </button>
      ) : null}
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
