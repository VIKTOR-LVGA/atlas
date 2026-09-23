"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClaimAction } from "@/app/(app)/claims/actions";
import { claimCategoryLabel, type ClaimCategory } from "@/lib/insurance-os/claims-client";
import { cn } from "@/lib/utils";

const CATEGORY_HINTS: Record<ClaimCategory, string> = {
  car_accident: "Collisione, urto, danno al veicolo",
  home_damage: "Acqua, incendio, rottura in casa",
  theft: "Sottrazione di beni o scasso",
  travel: "Annullamento, ritardo, assistenza",
  baggage: "Bagaglio smarrito o danneggiato",
  liability: "Danno causato a terzi",
  health_injury: "Cure, ricovero, infortunio",
  legal: "Controversia o vertenza legale",
  other: "Un evento che non rientra sopra",
};

const CATEGORIES = Object.keys(CATEGORY_HINTS) as ClaimCategory[];

const STEPS = ["Tipo di evento", "Cosa è successo", "Conferma"] as const;

export function ClaimWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ClaimCategory | null>(null);
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [peopleInvolved, setPeopleInvolved] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!category) return;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("category", category);
      formData.set("description", description);
      formData.set("eventDate", eventDate);
      formData.set("eventLocation", eventLocation);
      formData.set("estimatedAmount", estimatedAmount);
      formData.set("peopleInvolved", peopleInvolved);

      const result = await createClaimAction(formData);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Creazione non riuscita.");
        return;
      }
      router.push(`/claims/${result.data.id}`);
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ol className="flex items-center gap-2" aria-label="Avanzamento">
        {STEPS.map((label, index) => (
          <li key={label} className="min-w-0 flex-1">
            <span
              className={cn(
                "block h-1 rounded-full transition-colors duration-300",
                index <= step ? "bg-accent" : "bg-border"
              )}
            />
          </li>
        ))}
      </ol>
      <p className="text-[12px] text-muted">
        Passo {step + 1} di {STEPS.length} · {STEPS[step]}
      </p>

      <div className="atlas-consumer-card px-4 py-5">
        {step === 0 ? (
          <fieldset>
            <legend className="text-[16px] font-semibold tracking-tight text-foreground">
              Che tipo di evento è?
            </legend>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Serve ad ATLAS per capire quali polizze potrebbero entrare in gioco.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((item) => {
                const selected = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategory(item)}
                    className={cn(
                      "atlas-consumer-focus rounded-xl border px-4 py-3 text-left transition duration-200",
                      selected
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-card hover:bg-card-muted"
                    )}
                  >
                    <span className="block text-[14px] font-medium text-foreground">
                      {claimCategoryLabel(item)}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                      {CATEGORY_HINTS[item]}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
                Cosa è successo?
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Scrivi con parole tue. Data e luogo rendono la pratica più solida.
              </p>
            </div>

            <div>
              <label htmlFor="claim-description" className="atlas-section-eyebrow">
                Descrizione
              </label>
              <textarea
                id="claim-description"
                rows={5}
                maxLength={8000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Racconta la dinamica: cosa è successo, chi c’era, cosa è stato danneggiato."
                className="atlas-input mt-1.5 resize-y text-[14px] leading-relaxed"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="claim-date" className="atlas-section-eyebrow">
                  Data dell’evento
                </label>
                <input
                  id="claim-date"
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className="atlas-input mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="claim-place" className="atlas-section-eyebrow">
                  Luogo
                </label>
                <input
                  id="claim-place"
                  type="text"
                  maxLength={240}
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                  placeholder="Es. Zurigo, parcheggio interrato"
                  className="atlas-input mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="claim-amount" className="atlas-section-eyebrow">
                  Importo stimato (CHF)
                </label>
                <input
                  id="claim-amount"
                  type="text"
                  inputMode="decimal"
                  value={estimatedAmount}
                  onChange={(event) => setEstimatedAmount(event.target.value)}
                  placeholder="Facoltativo"
                  className="atlas-input mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="claim-people" className="atlas-section-eyebrow">
                  Persone coinvolte
                </label>
                <input
                  id="claim-people"
                  type="text"
                  maxLength={1000}
                  value={peopleInvolved}
                  onChange={(event) => setPeopleInvolved(event.target.value)}
                  placeholder="Facoltativo"
                  className="atlas-input mt-1.5"
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 && category ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
                Creiamo il dossier
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                ATLAS prepara checklist, allegati e le polizze potenzialmente pertinenti.
              </p>
            </div>

            <dl className="atlas-surface-muted space-y-1.5 rounded-xl px-4 py-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Tipo</dt>
                <dd className="text-foreground">{claimCategoryLabel(category)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Data</dt>
                <dd className="text-foreground">{eventDate || "Non indicata"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Luogo</dt>
                <dd className="min-w-0 truncate text-foreground">
                  {eventLocation || "Non indicato"}
                </dd>
              </div>
            </dl>

            <p className="atlas-alert-info rounded-xl px-4 py-3 text-[12px] leading-relaxed">
              Il dossier resta nel tuo spazio privato. ATLAS non lo invia alla compagnia al
              posto tuo: la denuncia resta un tuo gesto consapevole.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="status" className="atlas-alert-danger mt-4 rounded-xl px-4 py-3 text-[13px]">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || pending}
            className="atlas-btn-secondary min-h-11 px-4 text-[13px] disabled:opacity-40"
          >
            Indietro
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={step === 0 ? category === null : description.trim().length < 10}
              className="atlas-btn-primary min-h-11 px-5 text-[13px]"
            >
              Continua
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="atlas-btn-primary min-h-11 px-5 text-[13px]"
            >
              {pending ? "Creo il dossier…" : "Crea il dossier"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
