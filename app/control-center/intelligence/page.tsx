import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import { reviewIntelligenceApplicationAction } from "@/app/control-center/intelligence-actions";

export const metadata = { title: "Intelligence Partners | Control Center" };

export default async function ControlCenterIntelligencePage() {
  const { supabase } = await requireOperationsRole(["admin"]);

  const [{ data: applications }, { data: companies }] = await Promise.all([
    supabase
      .from("intelligence_applications")
      .select(
        "id, first_name, last_name, work_email, company_name, status, created_at, company_type"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("intelligence_companies")
      .select("id, display_name, status, company_type, module_access, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  const openApps = (applications ?? []).filter((row) =>
    ["submitted", "under_review"].includes(String(row.status))
  );
  const activeCompanies = (companies ?? []).filter((row) => row.status === "active");
  const suspended = (companies ?? []).filter((row) => row.status === "suspended");

  return (
    <>
      <OperationsHeader
        eyebrow="B2B"
        title="Intelligence Partners"
        description="Approvazione compagnie e entitlement moduli. Separato dai Broker Workspace."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Candidature aperte</p>
          <p className="mt-1 text-xl font-semibold">{openApps.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Attive</p>
          <p className="mt-1 text-xl font-semibold">{activeCompanies.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted">Sospese</p>
          <p className="mt-1 text-xl font-semibold">{suspended.length}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
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
                    {app.work_email} · {app.company_type} · {formatDate(String(app.created_at))}
                  </p>
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
                    </div>
                    <Link
                      href={`/control-center/intelligence`}
                      className="text-[11px] text-accent"
                    >
                      Moduli: {(company.module_access as string[] | null)?.length ?? 0}
                    </Link>
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
