"use client";

import { useMemo, useState } from "react";
import {
  CANTON_PATHS,
  SWISS_CANTON_CODES,
  cantonLabel,
  type SwissCantonCode,
} from "@/lib/swiss-cantons";
import { formatChfMoney } from "@/lib/analytics-period";
import { cn } from "@/lib/utils";

export type MapMetricKey =
  | "leads"
  | "clients"
  | "contracts"
  | "brokerRevenue"
  | "grossCommission"
  | "atlasRevenue"
  | "users"
  | "policies"
  | "consultations";

export type MapDatum = {
  canton: string;
  leads?: number;
  clients?: number;
  contracts?: number;
  brokerRevenue?: number;
  grossCommission?: number;
  atlasRevenue?: number;
  users?: number;
  policies?: number;
  consultations?: number;
  privacyMasked?: boolean;
};

const METRIC_LABELS: Record<MapMetricKey, string> = {
  leads: "Lead",
  clients: "Clienti",
  contracts: "Contratti",
  brokerRevenue: "Ricavo broker",
  grossCommission: "Commissioni lorde",
  atlasRevenue: "Revenue ATLAS",
  users: "Utenti",
  policies: "Polizze",
  consultations: "Consulenze",
};

function valueOf(row: MapDatum | undefined | null, metric: MapMetricKey) {
  if (!row) return 0;
  if (row.privacyMasked && (metric === "brokerRevenue" || metric === "grossCommission" || metric === "atlasRevenue")) {
    return 0;
  }
  return Number(row[metric] ?? 0);
}

export function SwitzerlandChoropleth({
  data,
  metric,
  title,
  onMetricChange,
  metrics,
  showAtlasShare = false,
}: {
  data: MapDatum[];
  metric: MapMetricKey;
  title: string;
  metrics: MapMetricKey[];
  onMetricChange?: (metric: MapMetricKey) => void;
  showAtlasShare?: boolean;
}) {
  const [selected, setSelected] = useState<SwissCantonCode | "UNKNOWN" | null>(null);
  const [hover, setHover] = useState<SwissCantonCode | null>(null);
  const [activeMetric, setActiveMetric] = useState<MapMetricKey>(metric);

  const byCanton = useMemo(() => {
    const map = new Map<string, MapDatum>();
    for (const row of data) map.set(row.canton, row);
    return map;
  }, [data]);

  const max = useMemo(() => {
    let m = 0;
    for (const code of SWISS_CANTON_CODES) {
      m = Math.max(m, valueOf(byCanton.get(code), activeMetric));
    }
    return m || 1;
  }, [activeMetric, byCanton]);

  const activeCode = hover ?? (selected && selected !== "UNKNOWN" ? selected : null);
  const active = activeCode ? byCanton.get(activeCode) : null;
  const unknown = byCanton.get("UNKNOWN");

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-[11px] text-muted">
            Solo aggregazioni cantonali. Nessun indirizzo o pin individuale.
          </p>
        </div>
        {metrics.length > 1 ? (
          <select
            className="rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            value={activeMetric}
            onChange={(event) => {
              const nextMetric = event.target.value as MapMetricKey;
              setActiveMetric(nextMetric);
              onMetricChange?.(nextMetric);
            }}
            aria-label="Metrica mappa"
          >
            {metrics.map((key) => (
              <option key={key} value={key}>
                {METRIC_LABELS[key]}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <svg
          viewBox="0 0 640 400"
          className="h-auto w-full max-h-[360px]"
          role="img"
          aria-label="Mappa della Svizzera per cantone"
        >
          <rect width="640" height="400" fill="transparent" />
          {SWISS_CANTON_CODES.map((code) => {
            const value = valueOf(byCanton.get(code), activeMetric);
            const intensity = value / max;
            const fill =
              value <= 0
                ? "var(--card-muted, #1e2430)"
                : `color-mix(in srgb, var(--accent) ${Math.round(18 + intensity * 72)}%, var(--card))`;
            return (
              <path
                key={code}
                d={CANTON_PATHS[code]}
                fill={fill}
                stroke="var(--border)"
                strokeWidth={activeCode === code ? 2.2 : 1}
                className="cursor-pointer transition-opacity hover:opacity-95"
                tabIndex={0}
                aria-label={`${cantonLabel(code)}: ${value}`}
                onMouseEnter={() => setHover(code)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(code)}
                onBlur={() => setHover(null)}
                onClick={() => setSelected(code)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(code);
                  }
                }}
              />
            );
          })}
        </svg>

        <div className="rounded-lg border border-border bg-card-muted/40 p-4 text-[12px]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {activeCode ? cantonLabel(activeCode) : "Seleziona un cantone"}
          </p>
          {activeCode && active?.privacyMasked ? (
            <p className="mt-3 text-muted">
              Pochi dati in questo cantone: i dettagli economici sono nascosti per privacy
              (soglia minima clienti).
            </p>
          ) : activeCode ? (
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{METRIC_LABELS[activeMetric]}</dt>
                <dd className="font-semibold tabular-nums">
                  {activeMetric === "brokerRevenue" || activeMetric === "grossCommission" || activeMetric === "atlasRevenue"
                    ? formatChfMoney(valueOf(active, activeMetric))
                    : valueOf(active, activeMetric)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Lead</dt>
                <dd className="tabular-nums">{active?.leads ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Clienti</dt>
                <dd className="tabular-nums">{active?.clients ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Contratti</dt>
                <dd className="tabular-nums">{active?.contracts ?? 0}</dd>
              </div>
              {showAtlasShare ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Revenue ATLAS</dt>
                  <dd className="tabular-nums">{formatChfMoney(active?.atlasRevenue)}</dd>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Ricavo broker</dt>
                  <dd className="tabular-nums">{formatChfMoney(active?.brokerRevenue)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-muted">Passa sul cantone o selezionalo per i dettagli.</p>
          )}

          {unknown && (unknown.leads || unknown.clients) ? (
            <p className={cn("mt-4 border-t border-border pt-3 text-[11px] text-muted")}>
              Non disponibile: {unknown.leads ?? 0} lead / {unknown.clients ?? 0} clienti senza
              cantone noto.
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted">
            <span className="h-2 w-8 rounded bg-[color-mix(in_srgb,var(--accent)_20%,var(--card))]" />
            Basso
            <span className="h-2 w-8 rounded bg-[color-mix(in_srgb,var(--accent)_85%,var(--card))]" />
            Alto
          </div>
        </div>
      </div>
    </section>
  );
}
