"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { runCheckupAction } from "@/app/(app)/atlas/actions";
import { MetricTile } from "@/components/consumer/EmptyState";
import type { CheckupResult } from "@/lib/insurance-os/checkup-types";
import { formatCHF, formatDateTime } from "@/lib/utils";

function CheckupList({
  title,
  description,
  items,
  tone = "neutral",
}: {
  title: string;
  description?: string;
  items: string[];
  tone?: "clear" | "verify" | "missing" | "neutral";
}) {
  if (items.length === 0) return null;

  const marker =
    tone === "clear"
      ? "bg-[var(--success-text)]"
      : tone === "verify"
        ? "bg-[var(--warning-text)]"
        : tone === "missing"
          ? "bg-[var(--muted)]"
          : "bg-[var(--info-text)]";

  return (
    <section className="atlas-consumer-card px-4 py-4">
      <h3 className="text-[14px] font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${marker}`}
            />
            <span className="text-[13px] leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CheckupView({
  initial,
  canRun,
}: {
  initial: CheckupResult | null;
  canRun: boolean;
}) {
  const [checkup, setCheckup] = useState<CheckupResult | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const response = await runCheckupAction();
      if (response.ok && response.data) {
        setCheckup(response.data);
      } else {
        setError(response.error ?? "Operazione non riuscita.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="atlas-consumer-card px-4 py-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Check-up del portafoglio
        </h2>
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted">
          ATLAS rilegge tutto quello che ha su di te e separa ciò che è chiaro, ciò che è da
          verificare e ciò che manca. Nessuna raccomandazione di acquisto.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={pending || !canRun}
            className="atlas-btn-primary min-h-11 px-5 text-[13px]"
          >
            {pending
              ? "Analisi in corso…"
              : checkup
                ? "Aggiorna il check-up"
                : "Esegui il check-up"}
          </button>
          {checkup ? (
            <span className="text-[12px] text-muted">
              Ultimo aggiornamento: {formatDateTime(checkup.createdAt)}
            </span>
          ) : null}
        </div>
        {!canRun ? (
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Serve almeno una polizza caricata.{" "}
            <Link href="/documents" className="font-medium text-accent">
              Carica un documento
            </Link>
            .
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="status" className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px]">
          {error}
        </p>
      ) : null}

      {checkup ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Polizze analizzate"
              value={String(checkup.policiesAnalyzed)}
            />
            <MetricTile
              label="Costo annuo noto"
              value={
                checkup.annualCostKnown !== null ? formatCHF(checkup.annualCostKnown) : "—"
              }
              hint={checkup.annualCostKnown === null ? "premi non ancora completi" : undefined}
            />
            <MetricTile
              label="Aree con copertura"
              value={String(checkup.categoriesCovered)}
            />
            <MetricTile
              label="Completezza dati"
              value={`${checkup.dataCompletenessPercent}%`}
              hint="quanto ATLAS riesce a leggere"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <CheckupList
              title="Cosa è chiaro"
              description="Confermato dai documenti caricati."
              items={checkup.clearItems}
              tone="clear"
            />
            <CheckupList
              title="Cosa è da verificare"
              description="Elementi ambigui nelle condizioni."
              items={checkup.verifyItems}
              tone="verify"
            />
            <CheckupList
              title="Cosa manca"
              description="Informazioni assenti. Non significa che sei scoperto."
              items={checkup.missingItems}
              tone="missing"
            />
            <CheckupList
              title="Possibili sovrapposizioni"
              description="Da confrontare con calma, non è una conclusione finanziaria."
              items={checkup.overlaps}
            />
            <CheckupList title="Cambiamenti recenti" items={checkup.recentChanges} />
            <CheckupList title="Scadenze nei prossimi mesi" items={checkup.upcomingDeadlines} />
          </div>

          {checkup.usefulQuestions.length > 0 ? (
            <section className="atlas-consumer-card px-4 py-4">
              <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                Domande utili da porti
              </h3>
              <ul className="mt-3 space-y-2">
                {checkup.usefulQuestions.map((question) => (
                  <li key={question} className="text-[13px] leading-relaxed text-muted-foreground">
                    {question}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/atlas/ask" className="atlas-btn-secondary min-h-10 text-[13px]">
                  Chiedi ad ATLAS
                </Link>
                <Link href="/consulting" className="atlas-btn-secondary min-h-10 text-[13px]">
                  Richiedi una revisione umana
                </Link>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
