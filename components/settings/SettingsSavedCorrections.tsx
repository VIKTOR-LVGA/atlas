"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { loadSavedCorrectionsSummary } from "@/app/(app)/settings/correction-summary-actions";
import type { UserCorrectionSummary } from "@/lib/correction-insights";
import { SectionCard } from "@/components/ui/SectionCard";

function formatCorrectionDate(value: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("it-CH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatFieldLabel(fieldName: string) {
  return fieldName
    .replace(/^policy\.details\./, "")
    .replace(/^policy\./, "")
    .replace(/^insured_person\./, "persona · ")
    .replace(/^coverage\./, "copertura · ")
    .replaceAll("_", " ");
}

export function SettingsSavedCorrections() {
  const [summary, setSummary] = useState<UserCorrectionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadSavedCorrectionsSummary()
      .then((result) => {
        if (active) {
          setSummary(result);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SectionCard
      title="Correzioni salvate"
      description="Quando correggi una bozza, Atlas conserva le modifiche per migliorare la qualità del tuo portfolio e preparare futuri miglioramenti dell'estrazione."
      bodyClassName="space-y-4"
    >
      <div className="rounded-xl border border-border-subtle bg-card-muted/30 px-4 py-3">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <BookMarked className="h-4 w-4 text-accent" aria-hidden />
          Segnali di correzione sul tuo account
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Questi dati restano collegati al tuo account. Non vengono usati per
          addestrare modelli esterni né condivisi con altri utenti.
        </p>
      </div>

      {loading ? (
        <p className="text-[12px] text-muted">Caricamento statistiche…</p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-card px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Correzioni totali
            </dt>
            <dd className="mt-1 text-[18px] font-semibold text-foreground">
              {summary?.totalCount ?? 0}
            </dd>
          </div>
          <div className="rounded-lg border border-border-subtle bg-card px-3 py-2.5 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Ultima correzione
            </dt>
            <dd className="mt-1 text-[14px] font-medium text-foreground">
              {formatCorrectionDate(summary?.lastCorrectionAt ?? null)}
            </dd>
          </div>
        </dl>
      )}

      {!loading && summary && summary.topFields.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Campi più corretti
          </p>
          <ul className="mt-2 space-y-1.5">
            {summary.topFields.map((field) => (
              <li
                key={field.fieldName}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-card-muted/20 px-3 py-2 text-[12px]"
              >
                <span className="text-foreground">
                  {formatFieldLabel(field.fieldName)}
                </span>
                <span className="font-semibold text-muted">{field.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && (summary?.totalCount ?? 0) === 0 ? (
        <p className="text-[12px] leading-relaxed text-muted">
          Non hai ancora correzioni salvate. Compariranno quando modifichi o
          confermi una bozza estratta da un documento.
        </p>
      ) : null}
    </SectionCard>
  );
}
