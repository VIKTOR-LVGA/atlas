"use client";

import { useActionState, useEffect, useState } from "react";
import { Mail, Trash2, X } from "lucide-react";
import {
  wipePortfolioAction,
  type AccountDangerActionState,
} from "@/app/(app)/settings/account-actions";
import { SectionCard } from "@/components/ui/SectionCard";
import { resolveProfileDeletionRequest } from "@/lib/account-support";
import type { CurrentProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: AccountDangerActionState = {
  status: "idle",
  message: "",
};

const CONFIRMATION_PHRASE = "ELIMINA";

type SettingsAccountManagementProps = {
  profile: CurrentProfile | null;
};

export function SettingsAccountManagement({ profile }: SettingsAccountManagementProps) {
  const [state, formAction, pending] = useActionState(
    wipePortfolioAction,
    initialState
  );
  const [confirmation, setConfirmation] = useState("");
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);

  const profileDeletionRequest = profile?.id
    ? resolveProfileDeletionRequest({
        userId: profile.id,
        userEmail: profile.email,
      })
    : { kind: "modal" as const };

  const canSubmit =
    confirmation.trim() === CONFIRMATION_PHRASE && !pending;

  useEffect(() => {
    if (!deletionModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDeletionModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deletionModalOpen]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">Gestione account</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Gestisci i dati del tuo portfolio e le richieste relative al tuo profilo.
        </p>
      </div>

      <SectionCard
        title="Elimina dati portfolio"
        description="Rimuove polizze, documenti caricati e dati estratti collegati al tuo account. L'operazione non può essere annullata."
        bodyClassName="space-y-3"
      >
        <form action={formAction} className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-medium text-muted-foreground">
              Digita ELIMINA per confermare.
            </span>
            <input
              type="text"
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder={CONFIRMATION_PHRASE}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              name="sign_out"
              className="h-3.5 w-3.5 rounded border-border accent-accent"
            />
            Esci dopo aver eliminato i dati
          </label>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-semibold transition sm:w-auto",
              canSubmit
                ? "bg-[var(--danger-text)] text-white hover:opacity-90"
                : "cursor-not-allowed border border-dashed border-border bg-card-muted/50 text-muted opacity-80"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {pending ? "Eliminazione in corso…" : "Elimina dati portfolio"}
          </button>
          {state.message ? (
            <p
              role="status"
              className={cn(
                "text-[11px] leading-relaxed",
                state.status === "success"
                  ? "text-[var(--success-text)]"
                  : "text-[var(--danger-text)]"
              )}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </SectionCard>

      <SectionCard
        title="Elimina profilo"
        description="Per eliminare completamente il profilo e l'accesso email, invia una richiesta di chiusura account. Ti guideremo nella verifica prima della cancellazione definitiva."
        bodyClassName="space-y-3"
      >
        <p className="text-[11px] leading-relaxed text-muted">
          La richiesta di eliminazione profilo verrà inviata al supporto Atlas.
        </p>

        {profileDeletionRequest.kind === "mailto" ? (
          <a
            href={profileDeletionRequest.url}
            className="atlas-btn-secondary inline-flex items-center gap-2 text-[12px]"
          >
            <Mail className="h-4 w-4" />
            Richiedi eliminazione profilo
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setDeletionModalOpen(true)}
            className="atlas-btn-secondary inline-flex items-center gap-2 text-[12px]"
          >
            <Mail className="h-4 w-4" />
            Richiedi eliminazione profilo
          </button>
        )}

        {profileDeletionRequest.kind === "mailto" &&
        !profileDeletionRequest.sendsToSupport ? (
          <p className="text-[10px] leading-relaxed text-muted">
            Si aprirà una bozza nel tuo client email da inoltrare al supporto Atlas.
          </p>
        ) : null}
      </SectionCard>

      {deletionModalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setDeletionModalOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="profile-deletion-modal-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id="profile-deletion-modal-title"
                className="text-[14px] font-semibold text-foreground"
              >
                Richiesta eliminazione profilo
              </h3>
              <button
                type="button"
                onClick={() => setDeletionModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-card-muted hover:text-foreground"
                aria-label="Chiudi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              Configura un indirizzo supporto per ricevere richieste di eliminazione
              profilo. Contatta il team Atlas per completare la chiusura del tuo account.
            </p>
            <button
              type="button"
              onClick={() => setDeletionModalOpen(false)}
              className="atlas-btn-secondary mt-4 w-full py-2 text-[12px]"
            >
              Ho capito
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
