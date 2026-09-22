import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import { refreshIntelligenceSnapshotsAction } from "@/app/control-center/intelligence-actions";

export const metadata = { title: "System Health | Control Center" };

export default async function ControlCenterHealthPage() {
  const { supabase } = await requireOperationsRole(["admin"]);

  const [{ data: system }, { data: funnel }] = await Promise.all([
    supabase.rpc("get_atlas_system_health"),
    supabase.rpc("get_pilot_funnel_metrics"),
  ]);

  const sys = (system ?? {}) as Record<string, unknown>;
  const intel = (sys.intelligence ?? {}) as Record<string, unknown>;
  const counts = (sys.counts ?? {}) as Record<string, unknown>;
  const funnelObj = (funnel ?? {}) as Record<string, unknown>;

  return (
    <>
      <OperationsHeader
        eyebrow="Operations"
        title="System health"
        description="Stato operativo ATLAS per il pilot. Nessun secret esposto."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Web</p>
          <p className="mt-1 text-lg font-semibold">{String(sys.web ?? "ok")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Database</p>
          <p className="mt-1 text-lg font-semibold">{String(sys.database ?? "—")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Intelligence snapshot</p>
          <p className="mt-1 text-lg font-semibold">
            {String(intel.last_run_status ?? "—")}
          </p>
          <p className="mt-1 text-[10px] text-muted">
            {intel.last_run_finished_at
              ? formatDate(String(intel.last_run_finished_at))
              : "nessun run"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Metodologia</p>
          <p className="mt-1 text-sm font-semibold">
            {String(intel.methodology_version ?? "—")}
          </p>
          <p className="mt-1 text-[10px] text-muted">
            k≥{String(intel.min_cohort_size ?? 20)}
          </p>
        </div>
      </div>

      {intel.last_run_error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-700">
          Ultimo errore snapshot: {String(intel.last_run_error)}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Operational counts">
          <ul className="space-y-2 text-[12px]">
            <li>Consumers: {String(counts.consumers ?? "—")}</li>
            <li>Brokers attivi: {String(counts.brokers ?? "—")}</li>
            <li>Polizze: {String(counts.policies ?? "—")}</li>
            <li>Documenti: {String(counts.documents ?? "—")}</li>
            <li>Consulenze: {String(counts.consultations ?? "—")}</li>
            <li>Offerte: {String(counts.offers ?? "—")}</li>
            <li>Contratti: {String(counts.contracts ?? "—")}</li>
          </ul>
        </OperationsPanel>

        <OperationsPanel title="Pilot funnel (factual)">
          <ul className="space-y-2 text-[12px]">
            <li>Signup consumers: {String(funnelObj.registered_consumers ?? "—")}</li>
            <li>Policies uploaded: {String(funnelObj.policies_uploaded ?? "—")}</li>
            <li>Review requested: {String(funnelObj.consultations_requested ?? "—")}</li>
            <li>Broker engaged: {String(funnelObj.broker_accepted ?? "—")}</li>
            <li>Offers: {String(funnelObj.offers_sent ?? "—")}</li>
            <li>Contracts: {String(funnelObj.contracts ?? "—")}</li>
          </ul>
          <form action={refreshIntelligenceSnapshotsAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-accent bg-accent-soft px-3 py-2 text-[11px] font-medium text-accent"
            >
              Rebuild Intelligence snapshots
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted">
            Dettaglio Intelligence:{" "}
            <Link href="/control-center/intelligence" className="text-accent">
              Partners &amp; snapshots
            </Link>
          </p>
        </OperationsPanel>
      </div>
    </>
  );
}
