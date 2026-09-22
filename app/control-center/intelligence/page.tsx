import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import {
  refreshIntelligenceSnapshotsAction,
  reviewIntelligenceApplicationAction,
  setIntelligenceCompanyStatusAction,
} from "@/app/control-center/intelligence-actions";

export const metadata = { title: "Intelligence Partners | Control Center" };

export default async function ControlCenterIntelligencePage() {
  const { supabase } = await requireOperationsRole(["admin"]);

  const [{ data: applications }, { data: companies }, { data: health }] =
    await Promise.all([
      supabase
        .from("intelligence_applications")
        .select(
          "id, first_name, last_name, work_email, company_name, legal_entity, job_title, status, created_at, company_type, website, country, operating_canton, access_reason, desired_modules"
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("intelligence_companies")
        .select("id, display_name, status, company_type, module_access, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase.rpc("get_intelligence_data_health"),
    ]);

  const openApps = (applications ?? []).filter((row) =>
    ["submitted", "under_review"].includes(String(row.status))
  );
  const healthObj = (health ?? {}) as Record<string, unknown>;
  const lastRun = (healthObj.last_run ?? null) as Record<string, unknown> | null;

  return (
    <>
      <OperationsHeader
        eyebrow="B2B"
        title="Intelligence Partners"
        description="Approvazione compagnie, entitlement moduli e salute snapshot. Separato dai Broker Workspace."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Candidature aperte</p>
          <p className="mt-1 text-xl font-semibold">{openApps.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Compagnie</p>
          <p className="mt-1 text-xl font-semibold">{(companies ?? []).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Policy facts</p>
          <p className="mt-1 text-xl font-semibold">
            {String(healthObj.policy_facts ?? "—")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Switch facts</p>
          <p className="mt-1 text-xl font-semibold">
            {String(healthObj.switch_facts ?? "—")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Market snapshots</p>
          <p className="mt-1 text-xl font-semibold">
            {String(healthObj.market_snapshots ?? "—")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">k / metodologia</p>
          <p className="mt-1 text-sm font-semibold">
            k≥{String(healthObj.min_cohort_size ?? 20)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            {String(healthObj.methodology_version ?? "—")}
          </p>
        </div>
      </div>

      <OperationsPanel title="Snapshot engine">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div>
            <p>
              Ultimo run:{" "}
              <span className="font-medium">
                {lastRun?.status ? String(lastRun.status) : "nessuno"}
              </span>
              {lastRun?.finished_at
                ? ` · ${formatDate(String(lastRun.finished_at))}`
                : ""}
            </p>
            <p className="mt-1 text-muted">
              Idonei — polizze: {String(lastRun?.policies_eligible ?? "—")} · quote:{" "}
              {String(lastRun?.quotes_eligible ?? "—")} · switch:{" "}
              {String(lastRun?.switches_eligible ?? "—")} · snapshot scritti:{" "}
              {String(lastRun?.snapshots_written ?? "—")}
            </p>
            {lastRun?.error_message ? (
              <p className="mt-1 text-red-600">{String(lastRun.error_message)}</p>
            ) : null}
          </div>
          <form action={refreshIntelligenceSnapshotsAction}>
            <button className="rounded-lg border border-accent bg-accent-soft px-3 py-2 text-[11px] font-medium text-accent">
              Rebuild snapshots
            </button>
          </form>
        </div>
      </OperationsPanel>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Applications">
          {!openApps.length ? (
            <p className="text-[12px] text-muted">Nessuna candidatura aperta.</p>
          ) : (
            <ul className="space-y-3">
              {openApps.map((app) => (
                <li
                  key={String(app.id)}
                  className="rounded-xl border border-border p-3 text-[12px]"
                >
                  <p className="font-semibold">
                    {app.first_name} {app.last_name} · {app.company_name}
                  </p>
                  <p className="mt-1 text-muted">
                    {app.work_email}
                    {app.job_title ? ` · ${app.job_title}` : ""} ·{" "}
                    {app.company_type} · {formatDate(String(app.created_at))}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {[app.website, app.country, app.operating_canton]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {Array.isArray(app.desired_modules) && app.desired_modules.length ? (
                    <p className="mt-1 text-[11px] text-muted">
                      Moduli richiesti:{" "}
                      {(app.desired_modules as string[])
                        .map((m) =>
                          ({
                            market_overview: "Panoramica mercato",
                            switching: "Switching",
                            premium_benchmark: "Benchmark premi",
                            coverage_benchmark: "Coperture",
                            geography: "Geografia",
                            insurer_comparison: "Compagnie",
                            reports: "Report",
                          } as Record<string, string>)[m] ?? m
                        )
                        .join(", ")}
                    </p>
                  ) : null}
                  {app.access_reason ? (
                    <p className="mt-2 line-clamp-3 text-[11px] text-foreground/80">
                      {String(app.access_reason)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={reviewIntelligenceApplicationAction}>
                      <input type="hidden" name="application_id" value={String(app.id)} />
                      <input type="hidden" name="decision" value="under_review" />
                      <button className="rounded-lg border border-border px-2.5 py-1.5 text-[11px]">
                        In revisione
                      </button>
                    </form>
                    <form action={reviewIntelligenceApplicationAction}>
                      <input type="hidden" name="application_id" value={String(app.id)} />
                      <input type="hidden" name="decision" value="approve" />
                      <button className="rounded-lg border border-accent bg-accent-soft px-2.5 py-1.5 text-[11px] text-accent">
                        Approva
                      </button>
                    </form>
                    <form action={reviewIntelligenceApplicationAction}>
                      <input type="hidden" name="application_id" value={String(app.id)} />
                      <input type="hidden" name="decision" value="reject" />
                      <input
                        type="hidden"
                        name="rejection_reason"
                        value="Requisiti non soddisfatti"
                      />
                      <button className="rounded-lg border border-border px-2.5 py-1.5 text-[11px]">
                        Rifiuta
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OperationsPanel>

        <OperationsPanel title="Active / Suspended">
          {!(companies ?? []).length ? (
            <p className="text-[12px] text-muted">
              Nessuna compagnia Intelligence attiva. Le candidature approvate
              appariranno qui.
            </p>
          ) : (
            <ul className="space-y-3">
              {(companies ?? []).map((company) => (
                <li
                  key={String(company.id)}
                  className="rounded-xl border border-border p-3 text-[12px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{company.display_name}</p>
                      <p className="mt-1 text-muted">
                        {company.company_type} · {company.status}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Moduli:{" "}
                        {((company.module_access as string[] | null) ?? []).join(", ") ||
                          "—"}
                      </p>
                    </div>
                    <form action={setIntelligenceCompanyStatusAction}>
                      <input type="hidden" name="company_id" value={String(company.id)} />
                      <input
                        type="hidden"
                        name="status"
                        value={company.status === "active" ? "suspended" : "active"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-2.5 py-1.5 text-[11px]"
                      >
                        {company.status === "active" ? "Sospendi" : "Riattiva"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OperationsPanel>
      </div>
    </>
  );
}
