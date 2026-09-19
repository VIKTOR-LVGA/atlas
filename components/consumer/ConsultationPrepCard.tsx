"use client";

import { useId, useState } from "react";

export function ConsultationPrepCard() {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  return (
    <section className="atlas-consumer-card px-5 py-5">
      <p className="text-[15px] font-semibold tracking-tight text-foreground">
        Vuoi far controllare le tue assicurazioni?
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Puoi richiedere gratuitamente una revisione da parte di un consulente partner ATLAS.
      </p>
      <button
        type="button"
        className="atlas-btn-secondary atlas-consumer-focus mt-4 min-h-11 px-4 text-[13px]"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={() => setOpen((value) => !value)}
      >
        Richiedi revisione
      </button>
      {open ? (
        <div
          id={titleId}
          role="status"
          className="mt-4 rounded-2xl border border-border bg-card-muted px-4 py-3 text-[13px] leading-relaxed text-muted"
        >
          La richiesta di consulenza è in preparazione. Potrai inviarla quando
          il servizio partner sarà attivo. Nessun dato è stato inviato.
        </div>
      ) : null}
    </section>
  );
}
