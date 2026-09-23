"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { askAtlasAction } from "@/app/(app)/atlas/actions";
import { VerificationBadge } from "@/components/insurance-os/VerificationBadge";
import type { AskAtlasResult } from "@/lib/insurance-os/ask-types";

const SUGGESTED_QUESTIONS = [
  "Quanto pago in totale all’anno?",
  "Quali franchigie risultano dalle mie polizze?",
  "Quali scadenze ho nei prossimi mesi?",
  "Ho coperture che sembrano sovrapporsi?",
  "Cosa non è ancora chiaro nei miei documenti?",
];

export function AskAtlasPanel({ hasPolicies }: { hasPolicies: boolean }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskAtlasResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setError(null);
    startTransition(async () => {
      const response = await askAtlasAction(trimmed);
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
          submit(question);
        }}
        className="atlas-consumer-card px-4 py-4"
      >
        <label htmlFor="ask-atlas-question" className="atlas-section-eyebrow">
          La tua domanda
        </label>
        <textarea
          id="ask-atlas-question"
          name="question"
          rows={3}
          value={question}
          maxLength={2000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Es. La mia assicurazione mobilia copre un furto in cantina?"
          className="atlas-input mt-2 resize-y text-[14px] leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-muted">
            ATLAS risponde solo con quello che trova nei tuoi documenti.
          </p>
          <button
            type="submit"
            disabled={pending || question.trim().length === 0}
            className="atlas-btn-primary min-h-11 px-5 text-[13px]"
          >
            {pending ? "Sto leggendo i documenti…" : "Chiedi ad ATLAS"}
          </button>
        </div>
      </form>

      <div>
        <p className="atlas-section-eyebrow">Domande frequenti</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setQuestion(suggestion);
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

      {!hasPolicies ? (
        <p className="atlas-alert-info rounded-xl px-4 py-3 text-[12px] leading-relaxed">
          Non hai ancora polizze caricate: ATLAS può rispondere solo in modo generico finché
          non legge i tuoi documenti.
        </p>
      ) : null}

      {error ? (
        <p role="status" className="atlas-alert-danger rounded-xl px-4 py-3 text-[13px]">
          {error}
        </p>
      ) : null}

      {result ? <AskAtlasAnswer result={result} /> : null}
    </div>
  );
}

export function AskAtlasAnswer({ result }: { result: AskAtlasResult }) {
  return (
    <article className="atlas-consumer-card px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-semibold tracking-tight text-foreground">
          {result.structured.summary}
        </p>
        <VerificationBadge status={result.verificationStatus} detailed />
      </div>

      <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-foreground">
        {result.answer}
      </p>

      {result.structured.sections.length > 0 ? (
        <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
          {result.structured.sections.map((section) => (
            <div key={section.title}>
              <p className="atlas-section-eyebrow">{section.title}</p>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {result.sources.length > 0 ? (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="atlas-section-eyebrow">Fonti nei tuoi documenti</p>
          <ul className="mt-2 space-y-1">
            {result.sources.slice(0, 10).map((source) => (
              <li key={`${source.kind}-${source.id}`}>
                <Link
                  href={source.href}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] transition hover:bg-card-muted"
                >
                  <span className="min-w-0 truncate text-foreground">{source.label}</span>
                  {source.page != null ? (
                    <span className="shrink-0 text-[11px] text-muted">pag. {source.page}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.structured.insufficientData ? (
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Per una risposta più precisa carica le condizioni generali o completa i dati della
          polizza interessata.
        </p>
      ) : null}
    </article>
  );
}
