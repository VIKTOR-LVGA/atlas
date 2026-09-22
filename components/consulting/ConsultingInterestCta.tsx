"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Send } from "lucide-react";
import { createConsultationRequestAction } from "@/app/(app)/consulting/actions";
import { SectionCard } from "@/components/ui/SectionCard";
import { consultationStatusLabel } from "@/lib/operations-labels";
import type { ConsultationRequest } from "@/lib/types";

const REASONS = [
  { code: "reduce_premium", label: "Voglio ridurre il premio" },
  { code: "verify_coverages", label: "Voglio verificare le coperture" },
  { code: "change_insurer", label: "Voglio cambiare compagnia" },
  { code: "check_adequacy", label: "Voglio capire se sono assicurato correttamente" },
  { code: "other", label: "Altro" },
] as const;

type Props = {
  readinessPercent: number;
  latestRequest: ConsultationRequest | null;
  resourceOptions: {
    policies: Array<{ id: string; label: string }>;
    documents: Array<{ id: string; label: string }>;
  };
};

export function ConsultingInterestCta({
  readinessPercent,
  latestRequest,
  resourceOptions,
}: Props) {
  const [request, setRequest] = useState(latestRequest);
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedLabels = useMemo(() => {
    return [
      ...resourceOptions.policies
        .filter((p) => selectedPolicies.includes(p.id))
        .map((p) => `Polizza · ${p.label}`),
      ...resourceOptions.documents
        .filter((d) => selectedDocuments.includes(d.id))
        .map((d) => `Documento · ${d.label}`),
    ];
  }, [resourceOptions, selectedPolicies, selectedDocuments]);

  if (request) {
    return (
      <SectionCard title="Richiesta di revisione" padding="sm" tone="primary">
        <div className="space-y-3" data-testid="consultation-confirmation">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-[var(--success-text)]" />
            Richiesta ricevuta
          </p>
          <p className="text-[12px] leading-relaxed text-muted">
            Stato: {consultationStatusLabel(request.status)}. Un eventuale contatto avverrà
            secondo la preferenza indicata; non è stata prenotata automaticamente alcuna
            consulenza.
          </p>
          <Link
            href={`/consultations/${request.id}`}
            className="atlas-btn-primary inline-flex items-center justify-center px-3 py-2 text-[12px]"
          >
            Apri la pratica
          </Link>
          <p className="text-[10px] text-muted">
            Inviata il {new Intl.DateTimeFormat("it-CH").format(new Date(request.createdAt))}.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Richiedi revisione" padding="sm" tone="primary">
      <div className="mb-3 flex gap-1" aria-label="Passaggi">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-[12px] text-muted">
            Perché chiedi una revisione? Non è un&apos;istruzione finanziaria vincolante.
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">Motivo</legend>
            {REASONS.map((item) => (
              <label
                key={item.code}
                className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-[12px]"
              >
                <input
                  type="radio"
                  name="reason"
                  value={item.code}
                  checked={reason === item.code}
                  onChange={() => setReason(item.code)}
                  className="mt-0.5"
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          {reason === "other" ? (
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="Descrivi brevemente"
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            />
          ) : null}
          <button
            type="button"
            disabled={!reason}
            className="atlas-btn-primary w-full py-2.5 text-[12px]"
            onClick={() => setStep(2)}
          >
            Continua
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-[12px] text-muted">
            Scegli cosa condividere. Niente è preselezionato.
          </p>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {resourceOptions.policies.map((resource) => (
              <label key={resource.id} className="flex items-start gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={selectedPolicies.includes(resource.id)}
                  onChange={(e) =>
                    setSelectedPolicies((prev) =>
                      e.target.checked
                        ? [...prev, resource.id]
                        : prev.filter((id) => id !== resource.id)
                    )
                  }
                  className="mt-0.5"
                />
                <span>Polizza · {resource.label}</span>
              </label>
            ))}
            {resourceOptions.documents.map((resource) => (
              <label key={resource.id} className="flex items-start gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(resource.id)}
                  onChange={(e) =>
                    setSelectedDocuments((prev) =>
                      e.target.checked
                        ? [...prev, resource.id]
                        : prev.filter((id) => id !== resource.id)
                    )
                  }
                  className="mt-0.5"
                />
                <span>Documento · {resource.label}</span>
              </label>
            ))}
            {!resourceOptions.policies.length && !resourceOptions.documents.length ? (
              <p className="text-[10px] text-muted">Nessun elemento condividibile.</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button type="button" className="atlas-btn-secondary flex-1 py-2 text-[12px]" onClick={() => setStep(1)}>
              Indietro
            </button>
            <button type="button" className="atlas-btn-primary flex-1 py-2 text-[12px]" onClick={() => setStep(3)}>
              Continua
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-foreground">
            Condividerai con il consulente:
          </p>
          <ul className="space-y-1.5 text-[12px] text-muted">
            {selectedLabels.map((label) => (
              <li key={label} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success-text)]" />
                {label}
              </li>
            ))}
            {!selectedLabels.length ? (
              <li>Nessuna polizza/documento (solo messaggio e preferenze contatto).</li>
            ) : null}
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success-text)]" />
              Campi profilo necessari al contatto (nome, email/telefono se indicati)
            </li>
          </ul>
          <p className="rounded-lg border border-border bg-background px-3 py-2 text-[11px] leading-relaxed text-muted">
            Non verranno condivise automaticamente altre polizze, documenti non selezionati,
            nucleo familiare completo, dati di pagamento o il profilo intero.
          </p>
          <p className="text-[10px] text-muted">
            Potrai revocare l&apos;accesso quando la pratica sarà chiusa, salvo dati che devono
            essere conservati per motivi operativi/audit.
          </p>
          <div className="flex gap-2">
            <button type="button" className="atlas-btn-secondary flex-1 py-2 text-[12px]" onClick={() => setStep(2)}>
              Indietro
            </button>
            <button type="button" className="atlas-btn-primary flex-1 py-2 text-[12px]" onClick={() => setStep(4)}>
              Continua
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await createConsultationRequestAction({
                requestType: "portfolio_review",
                message,
                preferredContactMethod: (contactMethod || null) as "email" | "phone" | null,
                preferredContactTime: contactTime,
                reviewReason: reason,
                reviewReasonDetail: reasonDetail,
                consent,
                sharedResources: [
                  ...selectedPolicies.map((id) => ({ type: "policy" as const, id })),
                  ...selectedDocuments.map((id) => ({ type: "document" as const, id })),
                ],
              });
              setFeedback(result.message);
              if (result.ok && result.data) setRequest(result.data);
            });
          }}
        >
          <label className="block text-[11px] font-medium text-muted">
            Modalità di contatto
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            >
              <option value="">Da concordare</option>
              <option value="email">Email</option>
              <option value="phone">Telefono</option>
            </select>
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Orario preferito
            <input
              value={contactTime}
              onChange={(e) => setContactTime(e.target.value)}
              placeholder="Es. giorni feriali, 17–19"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            />
          </label>
          <label className="block text-[11px] font-medium text-muted">
            Messaggio facoltativo
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            />
          </label>
          <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <input
              required
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
              aria-label="Consenso alla revisione"
            />
            Confermo di voler condividere gli elementi selezionati con il consulente assegnato
            per questa revisione. Il consenso non è preselezionato.
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="atlas-btn-secondary flex-1 py-2.5 text-[12px]"
              onClick={() => setStep(3)}
            >
              Indietro
            </button>
            <Link
              href="/documents"
              className="atlas-btn-secondary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px]"
            >
              <FileText className="h-4 w-4" />
              Controlla dossier
            </Link>
            <button
              disabled={pending || !consent}
              className="atlas-btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px]"
            >
              <Send className="h-4 w-4" />
              {pending ? "Invio..." : "Conferma e invia"}
            </button>
          </div>
          {feedback ? <p role="status" className="text-[11px] text-muted">{feedback}</p> : null}
          <p className="text-[10px] text-muted">Completezza del dossier {readinessPercent}%.</p>
        </form>
      ) : null}
    </SectionCard>
  );
}
