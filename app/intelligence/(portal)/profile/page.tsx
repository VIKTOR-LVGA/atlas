import {
  IntelligenceMethodNote,
} from "@/components/intelligence/IntelligenceUi";
import {
  INTELLIGENCE_MODULES,
  INTELLIGENCE_REPRESENTATIVENESS_NOTE,
  requireIntelligenceAccess,
} from "@/lib/intelligence-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Profilo | ATLAS Intelligence" };

export default async function IntelligenceProfilePage() {
  const identity = await requireIntelligenceAccess();
  const supabase = await getSupabaseServerClient();

  const { data: membership } = await supabase
    .from("intelligence_memberships")
    .select("member_role, company_id, intelligence_companies(display_name, status, module_access)")
    .eq("user_id", identity.user!.id)
    .eq("active", true)
    .maybeSingle();

  const company = Array.isArray(membership?.intelligence_companies)
    ? membership?.intelligence_companies[0]
    : membership?.intelligence_companies;

  const modules =
    ((company as { module_access?: string[] } | null)?.module_access as
      | string[]
      | undefined) ?? [...INTELLIGENCE_MODULES];

  return (
    <>
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Profilo partner</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
          Accesso company-scoped. I permessi moduli sono gestiti da ATLAS Admin.
        </p>
        <IntelligenceMethodNote>{INTELLIGENCE_REPRESENTATIVENESS_NOTE}</IntelligenceMethodNote>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/70 p-5 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-muted">Compagnia</p>
          <p className="mt-2 text-[16px] font-semibold">
            {(company as { display_name?: string } | null)?.display_name ??
              (identity.role === "admin" ? "Admin ATLAS" : "—")}
          </p>
          <p className="mt-1 text-muted">
            Stato: {(company as { status?: string } | null)?.status ?? "—"} · Ruolo:{" "}
            {membership?.member_role ?? (identity.role === "admin" ? "admin" : "—")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-5 text-[13px]">
          <p className="text-[11px] uppercase tracking-wide text-muted">Moduli abilitati</p>
          <ul className="mt-2 space-y-1 text-muted">
            {modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
