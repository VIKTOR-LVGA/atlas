"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { consumerOfferDecisionAction } from "@/app/(app)/consultations/actions";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  comparisonStateLabel,
  type OfferComparisonResult,
} from "@/lib/offer-comparison";

type Props = {
  consultationId: string;
  offerId: string;
  offer: {
    insurer: string;
    product: string;
    premium_amount: number | string | null;
    premium_frequency: string | null;
    currency: string | null;
    consumer_visible_notes: string | null;
    status: string;
    version?: number | null;
    verified_at?: string | null;
    quote_document_id?: string | null;
  };
  comparison: OfferComparisonResult;
  pdfHref?: string | null;
};

export function OfferComparisonClient({
  consultationId,
  offerId,
  offer,
  comparison,
  pdfHref,
}: Props) {
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const premium =
    offer.premium_amount != null
      ? `${offer.currency ?? "CHF"} ${Number(offer.premium_amount).toLocaleString("it-CH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "Premio da confermare";

  return (
    <div className="space-y-4" data-testid="offer-comparison">
      <Link
        href={`/consultations/${consultationId}?tab=offers`}
        className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Torna alla pratica
      </Link>

      <header className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
          {offer.verified_at ? "Preventivo verificato" : "Nuova offerta"}
          {offer.version ? ` · v${offer.version}` : ""}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
          {offer.insurer}
        </h1>
        <p className="text-[14px] text-muted">{offer.product}</p>
        <p className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
          {premium}
          {offer.premium_frequency ? (
            <span className="ml-2 text-[13px] font-normal text-muted">
              / {offer.premium_frequency}
            </span>
          ) : null}
        </p>
        {comparison.badges.length ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Indicatori fattuali">
            {comparison.badges.map((badge) => (
              <li
                key={badge}
                className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
              >
                {badge}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <SectionCard title="Rispetto alla tua polizza attuale" padding="sm">
        <ul className="space-y-2">
          {comparison.summaryLines.map((line) => (
            <li key={line} className="text-[13px] leading-relaxed text-foreground">
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted">
          ATLAS confronta differenze oggettive sui campi disponibili. Nessuna offerta è
          etichettata come &quot;migliore&quot; in assoluto.
        </p>
      </SectionCard>

      <SectionCard title="Confronto dettagliato" padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-2 font-medium">Voce</th>
                <th className="py-2 pr-2 font-medium">Attuale</th>
                <th className="py-2 pr-2 font-medium">Offerta</th>
                <th className="py-2 font-medium">Stato</th>
              </tr>
            </thead>
            <tbody>
              {comparison.items.map((item) => (
                <tr key={item.key} className="border-b border-border/70 align-top">
                  <td className="py-2.5 pr-2 font-medium text-foreground">{item.label}</td>
                  <td className="py-2.5 pr-2 text-muted">{item.current ?? "—"}</td>
                  <td className="py-2.5 pr-2 text-muted">{item.offer ?? "—"}</td>
                  <td className="py-2.5">
                    <span className="inline-block rounded border border-border px-1.5 py-0.5 text-[10px]">
                      {comparisonStateLabel(item.state)}
                    </span>
                    {item.difference ? (
                      <p className="mt-1 text-[10px] text-muted">{item.difference}</p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {offer.consumer_visible_notes ? (
        <SectionCard title="Nota del consulente" padding="sm">
          <p className="text-[13px] leading-relaxed text-foreground">
            {offer.consumer_visible_notes}
          </p>
        </SectionCard>
      ) : null}

      {pdfHref ? (
        <SectionCard title="Preventivo originale" padding="sm">
          <a
            href={pdfHref}
            className="atlas-btn-secondary inline-flex px-3 py-2 text-[12px]"
            target="_blank"
            rel="noreferrer"
          >
            Apri PDF preventivo
          </a>
        </SectionCard>
      ) : null}

      <SectionCard title="La tua decisione" padding="sm">
        <p className="mb-3 text-[12px] text-muted">
          Non è un acquisto vincolante. Comunica l&apos;interesse al consulente.
        </p>
        <label className="mb-3 block text-[11px] text-muted">
          Messaggio (opzionale)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["interested", "Sono interessato"],
              ["clarification", "Ho una domanda"],
              ["declined", "Non sono interessato"],
              ["request_appointment", "Richiedi appuntamento"],
            ] as const
          ).map(([decision, label]) => (
            <button
              key={decision}
              type="button"
              disabled={pending}
              className={
                decision === "interested"
                  ? "atlas-btn-primary px-3 py-2 text-[12px]"
                  : "atlas-btn-secondary px-3 py-2 text-[12px]"
              }
              onClick={() =>
                startTransition(async () => {
                  const result = await consumerOfferDecisionAction({
                    consultationId,
                    offerId,
                    decision,
                    note,
                  });
                  setMsg(result.message);
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {msg ? <p className="mt-2 text-[11px] text-muted">{msg}</p> : null}
      </SectionCard>
    </div>
  );
}
