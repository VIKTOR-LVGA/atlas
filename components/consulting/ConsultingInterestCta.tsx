"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Send } from "lucide-react";
import { createConsultationRequestAction } from "@/app/(app)/consulting/actions";
import { SectionCard } from "@/components/ui/SectionCard";
import { consultationStatusLabel } from "@/lib/operations-labels";
import type { ConsultationRequest } from "@/lib/types";

type ConsultingInterestCtaProps = {
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
}: ConsultingInterestCtaProps) {
  const [request, setRequest] = useState(latestRequest);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

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
          <p className="text-[10px] text-muted">
            Inviata il {new Intl.DateTimeFormat("it-CH").format(new Date(request.createdAt))}.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Revisione gratuita" padding="sm" tone="primary">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await createConsultationRequestAction({
              requestType: "portfolio_review",
              message: String(form.get("message") || ""),
              preferredContactMethod: (String(form.get("contact_method") || "") || null) as
                | "email"
                | "phone"
                | null,
              preferredContactTime: String(form.get("contact_time") || ""),
              consent: form.get("consent") === "on",
              sharedResources: [
                ...form.getAll("shared_policy").map((id) => ({
                  type: "policy" as const,
                  id: String(id),
                })),
                ...form.getAll("shared_document").map((id) => ({
                  type: "document" as const,
                  id: String(id),
                })),
              ],
            });
            setMessage(result.message);
            if (result.ok && result.data) setRequest(result.data);
          });
        }}
      >
        <p className="text-[12px] leading-relaxed text-muted">
          Invia il dossier per una verifica umana. La richiesta non implica una raccomandazione,
          un preventivo o una promessa di risparmio.
        </p>
        <p className="rounded-lg border border-accent/30 bg-accent-soft/50 px-3 py-2 text-[12px] leading-relaxed text-foreground">
          Questi dati saranno condivisi con il consulente assegnato. Scegli tu cosa rendere
          visibile: niente è preselezionato.
        </p>
        <label className="block text-[11px] font-medium text-muted">
          Modalità di contatto
          <select name="contact_method" className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]">
            <option value="">Da concordare</option>
            <option value="email">Email</option>
            <option value="phone">Telefono</option>
          </select>
        </label>
        <label className="block text-[11px] font-medium text-muted">
          Orario preferito
          <input
            name="contact_time"
            placeholder="Es. giorni feriali, 17–19"
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
          />
        </label>
        <label className="block text-[11px] font-medium text-muted">
          Messaggio facoltativo
          <textarea
            name="message"
            maxLength={4000}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
          />
        </label>
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-[11px] font-semibold text-foreground">
            Dati da condividere
          </legend>
          <p className="mb-2 text-[10px] leading-relaxed text-muted">
            Il consulente vedrà solo gli elementi selezionati. Nessun documento o polizza è
            condiviso automaticamente.
          </p>
          <div className="max-h-36 space-y-2 overflow-y-auto">
            {resourceOptions.policies.map((resource) => (
              <label key={resource.id} className="flex items-start gap-2 text-[11px] text-muted">
                <input type="checkbox" name="shared_policy" value={resource.id} className="mt-0.5" />
                <span>Polizza · {resource.label}</span>
              </label>
            ))}
            {resourceOptions.documents.map((resource) => (
              <label key={resource.id} className="flex items-start gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  name="shared_document"
                  value={resource.id}
                  className="mt-0.5"
                />
                <span>Documento · {resource.label}</span>
              </label>
            ))}
            {!resourceOptions.policies.length && !resourceOptions.documents.length ? (
              <p className="text-[10px] text-muted">
                Il dossier non contiene ancora elementi condivisibili.
              </p>
            ) : null}
          </div>
        </fieldset>
        <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <input
            aria-label="Consenso alla revisione"
            required
            name="consent"
            type="checkbox"
            className="mt-0.5"
          />
          Acconsento all&apos;uso dei dati del mio dossier ATLAS per gestire questa richiesta di
          revisione e l&apos;eventuale contatto. Il consenso non è preselezionato.
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/documents"
            className="atlas-btn-secondary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px]"
          >
            <FileText className="h-4 w-4" />
            Controlla dossier
          </Link>
          <button
            disabled={pending}
            className="atlas-btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px]"
          >
            <Send className="h-4 w-4" />
            {pending ? "Invio..." : "Richiedi revisione gratuita"}
          </button>
        </div>
        {message ? (
          <p role="status" className="text-[11px] text-muted">
            {message}
          </p>
        ) : null}
        <p className="text-[10px] text-muted">Completezza del dossier {readinessPercent}%.</p>
      </form>
    </SectionCard>
  );
}
