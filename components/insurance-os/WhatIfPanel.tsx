"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { whatIfAction } from "@/app/(app)/atlas/actions";
import { VerificationBadge } from "@/components/insurance-os/VerificationBadge";
import type { WhatIfResult } from "@/lib/insurance-os/ask-types";

const SUGGESTED_SCENARIOS = [
  "Mi rubano il telefono in vacanza",
  "Si rompe un tubo e allago l’appartamento del vicino",
  "Faccio un incidente in auto per colpa mia",
  "Mio figlio danneggia la bici di un amico",
  "Mi infortuno durante una gita in montagna",
  "Devo contestare una fattura e mi serve un avvocato",
];

function FindingList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="atlas-section-eyebrow">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="text-[13px] leading-relaxed text-muted-foreground before:mr-2 before:text-muted before:content-['—']"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhatIfPanel() {
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setError(null);
    startTransition(async () => {
      const response = await whatIfAction(trimmed);
      if (response.ok && response.data) {
        setResult(response.data);
      } else {
        setResult(null);
        setError(response.error ?? "Operazione non riuscita.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(scenario);
        }}
        className="atlas-consumer-card px-4 py-4"
      >
        <label htmlFor="what-if-scenario" className="atlas-section-eyebrow">
          Lo scenario
        </label>
        <textarea
          id="what-if-scenario"
          name="scenario"
          rows={3}
          value={scenario}
          maxLength={2000}
          onChange={(event) => setScenario(event.target.value)}
          placeholder="Descrivi cosa potrebbe succedere, con parole tue."
          className="atlas-input mt-2 resize-y text-[14px] leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-muted">
            È una simulazione basata sui tuoi documenti, non una conferma di copertura.
          </p>
          <button
            type="submit"
            disabled={pending || scenario.trim().length === 0}
            className="atlas-btn-primary min-h-11 px-5 text-[13px]"
          >
            {pending ? "Analisi in corso…" : "Analizza lo scenario"}
          </button>
        </div>
      </form>

      <div>
        <p className="atlas-section-eyebrow">Scenari suggeriti</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_SCENARIOS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setScenario(suggestion);
                  submit(suggestion);
                }}
                className="atlas-btn-secondary min-h-9 px-3 text-[12px] disabled:opacity-50"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <p role="status" className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px]">
          {error}
        </p>
      ) : null}

      {result ? (
        <article className="atlas-consumer-card space-y-5 px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 text-[14px] font-semibold tracking-tight text-foreground">
              {result.scenario}
            </p>
            <VerificationBadge status={result.verificationStatus} detailed />
          </div>

          {result.relevantPolicies.length > 0 ? (
            <div>
              <p className="atlas-section-eyebrow">Polizze che potrebbero entrare in gioco</p>
              <ul className="mt-2 space-y-1">
                {result.relevantPolicies.map((policy) => (
                  <li key={policy.id}>
                    <Link
                      href={policy.href}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-card-muted"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {policy.provider}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{policy.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <FindingList title="Cosa risulta dai documenti" items={result.findings} />
          <FindingList title="Cosa resta da verificare" items={result.uncertainties} />
          <FindingList title="Se succedesse davvero" items={result.suggestedActions} />

          {result.sources.length > 0 ? (
            <div className="border-t border-border-subtle pt-4">
              <p className="atlas-section-eyebrow">Fonti</p>
              <ul className="mt-2 space-y-1">
                {result.sources.slice(0, 8).map((source) => (
                  <li key={`${source.kind}-${source.id}`}>
                    <Link
                      href={source.href}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-card-muted"
                    >
                      <span className="min-w-0 truncate text-foreground">{source.label}</span>
                      {source.page != null ? (
                        <span className="shrink-0 text-[11px] text-muted">
                          pag. {source.page}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
            <Link href="/claims/new" className="atlas-btn-secondary min-h-10 text-[13px]">
              Prepara un dossier sinistro
            </Link>
            <Link href="/documents" className="atlas-btn-secondary min-h-10 text-[13px]">
              Carica condizioni mancanti
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  );
}
