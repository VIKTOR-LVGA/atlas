"use client";

import { useEffect, useMemo, useState } from "react";
import {
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

type CantonFeature = { code: SwissCantonCode; name: string; d: string };
type CantonGeo = { viewBox: string; features: CantonFeature[] };

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
  if (
    row.privacyMasked &&
    (metric === "brokerRevenue" ||
      metric === "grossCommission" ||
      metric === "atlasRevenue")
  ) {
    return 0;
  }
  return Number(row[metric] ?? 0);
}

function isMoneyMetric(metric: MapMetricKey) {
  return (
    metric === "brokerRevenue" ||
    metric === "grossCommission" ||
    metric === "atlasRevenue"
  );
}

export function SwitzerlandChoropleth({
  data,
  metric,
  title,
  onMetricChange,
  metrics,
  showAtlasShare = false,
  showRanking = false,
  emptyHint,
}: {
  data: MapDatum[];
  metric: MapMetricKey;
  title: string;
  metrics: MapMetricKey[];
  onMetricChange?: (metric: MapMetricKey) => void;
  showAtlasShare?: boolean;
  showRanking?: boolean;
  emptyHint?: string;
}) {
  const [geo, setGeo] = useState<CantonGeo | null>(null);
  const [selected, setSelected] = useState<SwissCantonCode | null>(null);
  const [hover, setHover] = useState<SwissCantonCode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [metricOverride, setMetricOverride] = useState<MapMetricKey | null>(null);
  const activeMetric = metricOverride ?? metric;

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/switzerland-cantons.json")
      .then((res) => res.json())
      .then((payload: CantonGeo) => {
        if (!cancelled) setGeo(payload);
      })
      .catch(() => {
        if (!cancelled) setGeo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    return m;
  }, [activeMetric, byCanton]);

  const activeCode = hover ?? selected;
  const active = activeCode ? byCanton.get(activeCode) : null;
  const unknown = byCanton.get("UNKNOWN");
  const unknownCount = (unknown?.leads ?? 0) + (unknown?.clients ?? 0);
  const ranking = useMemo(() => {
    return SWISS_CANTON_CODES.map((code) => ({
      code,
      value: valueOf(byCanton.get(code), activeMetric),
    }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [activeMetric, byCanton]);

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-[11px] text-muted">
            {max <= 0 && emptyHint
              ? emptyHint
              : "Confini cantonali reali · solo aggregazioni · nessun indirizzo individuale"}
          </p>
        </div>
        {metrics.length > 1 ? (
          <select
            className="rounded-lg border border-border bg-input px-3 py-2 text-[12px]"
            value={activeMetric}
            onChange={(event) => {
              const nextMetric = event.target.value as MapMetricKey;
              setMetricOverride(nextMetric);
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

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_88%,#0b1220),var(--card))]">
          {!geo ? (
            <div className="flex h-[280px] items-center justify-center text-[12px] text-muted sm:h-[360px]">
              Caricamento mappa…
            </div>
          ) : (
            <svg
              viewBox={geo.viewBox}
              className="h-auto w-full max-h-[420px]"
              role="img"
              aria-label="Mappa della Svizzera per cantone"
              onMouseLeave={() => {
                setHover(null);
                setTooltip(null);
              }}
            >
              <defs>
                <filter id="cantonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodOpacity="0.35" />
                </filter>
              </defs>
              {geo.features.map((feature) => {
                const value = valueOf(byCanton.get(feature.code), activeMetric);
                const intensity = max > 0 ? value / max : 0;
                const fill =
                  max <= 0 || value <= 0
                    ? "color-mix(in srgb, var(--card-muted) 88%, #1a2333)"
                    : `color-mix(in srgb, var(--accent) ${Math.round(22 + intensity * 70)}%, var(--card))`;
                const isActive = activeCode === feature.code;
                return (
                  <path
                    key={feature.code}
                    d={feature.d}
                    fill={fill}
                    stroke={isActive ? "var(--accent)" : "color-mix(in srgb, var(--border) 70%, transparent)"}
                    strokeWidth={isActive ? 1.6 : 0.7}
                    filter={isActive ? "url(#cantonGlow)" : undefined}
                    className="cursor-pointer transition-[fill,stroke-width] duration-200"
                    tabIndex={0}
                    aria-label={`${cantonLabel(feature.code)}: ${value}`}
                    onMouseEnter={(event) => {
                      setHover(feature.code);
                      const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setTooltip({
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                      });
                    }}
                    onMouseMove={(event) => {
                      const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setTooltip({
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                      });
                    }}
                    onFocus={() => setHover(feature.code)}
                    onBlur={() => setHover(null)}
                    onClick={() => setSelected(feature.code)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(feature.code);
                      }
                    }}
                  />
                );
              })}
            </svg>
          )}

          {hover && tooltip ? (
            <div
              className="pointer-events-none absolute z-10 min-w-[10.5rem] rounded-lg border border-border bg-card/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur"
              style={{ left: Math.min(tooltip.x + 12, 280), top: Math.max(tooltip.y - 12, 8) }}
            >
              <p className="font-semibold">{cantonLabel(hover)}</p>
              <dl className="mt-1.5 space-y-0.5 tabular-nums text-muted">
                {(
                  [
                    ["users", "Utenti"],
                    ["policies", "Polizze"],
                    ["consultations", "Consulenze"],
                    ["leads", "Lead"],
                    ["contracts", "Contratti"],
                    showAtlasShare ? ["atlasRevenue", "ATLAS Revenue"] : ["brokerRevenue", "Ricavo broker"],
                  ] as Array<[MapMetricKey, string]>
                ).map(([key, label]) => (
                  <div key={key} className="flex justify-between gap-3">
                    <dt>{label}</dt>
                    <dd className="font-medium text-foreground">
                      {isMoneyMetric(key)
                        ? formatChfMoney(valueOf(byCanton.get(hover), key))
                        : valueOf(byCanton.get(hover), key)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card-muted/30 p-4 text-[12px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {activeCode ? cantonLabel(activeCode) : "Seleziona un cantone"}
          </p>
          {activeCode && active?.privacyMasked ? (
            <p className="mt-3 text-muted">
              Pochi dati in questo cantone: i dettagli economici sono nascosti per privacy
              (soglia minima clienti).
            </p>
          ) : activeCode ? (
            <dl className="mt-4 space-y-2.5">
              {(
                [
                  ["users", "Utenti"],
                  ["policies", "Polizze"],
                  ["leads", "Lead"],
                  ["consultations", "Consulenze"],
                  ["clients", "Clienti"],
                  ["contracts", "Contratti"],
                  showAtlasShare ? ["atlasRevenue", "ATLAS Revenue"] : ["brokerRevenue", "Ricavo broker"],
                  ["grossCommission", "Commissioni lorde"],
                ] as Array<[MapMetricKey, string]>
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold tabular-nums">
                    {isMoneyMetric(key)
                      ? formatChfMoney(valueOf(active, key))
                      : valueOf(active, key)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-muted">
              Passa sul cantone o selezionalo. Con zero dati la mappa resta neutra.
            </p>
          )}

          {unknownCount > 0 ? (
            <p className={cn("mt-4 border-t border-border pt-3 text-[11px] text-muted")}>
              Cantone non disponibile: {unknown?.leads ?? 0} lead / {unknown?.clients ?? 0}{" "}
              clienti senza cantone noto.
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-2 text-[10px] text-muted">
            <span className="h-2 w-8 rounded bg-[color-mix(in_srgb,var(--card-muted)_90%,#1a2333)]" />
            Zero
            <span className="h-2 w-8 rounded bg-[color-mix(in_srgb,var(--accent)_30%,var(--card))]" />
            Basso
            <span className="h-2 w-8 rounded bg-[color-mix(in_srgb,var(--accent)_85%,var(--card))]" />
            Alto
          </div>
        </div>
      </div>

      {showRanking && ranking.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-[12px] font-semibold">Cantoni principali</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {ranking.map((row, index) => (
              <li
                key={row.code}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[12px]"
              >
                <span className="text-muted">
                  {index + 1}. {cantonLabel(row.code)}
                </span>
                <span className="font-semibold tabular-nums">
                  {isMoneyMetric(activeMetric)
                    ? formatChfMoney(row.value)
                    : row.value}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
