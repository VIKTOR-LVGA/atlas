import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response("Non autorizzato", { status: 401, headers: { "Cache-Control": "no-store" } });

  const tables = ["profiles", "policies", "documents", "extraction_corrections", "insura_chat_history", "insura_operational_events", "annual_checkups", "atlas_conversations", "atlas_messages", "family_members", "vehicles", "properties", "policy_coverages", "policy_document_links", "policy_change_events", "policy_members", "insurance_claims", "insurance_claim_files", "consultation_requests", "consultation_shared_resources", "insurance_timeline_events", "coverage_map_snapshots", "user_activity_events", "user_roles", "opportunities", "partner_applications", "intelligence_applications", "intelligence_memberships", "intelligence_query_audit", "broker_contracts", "commission_attributions", "insura_deletion_requests"] as const;
  const records: Record<string, unknown> = {};
  for (const table of tables) {
    const filter = table === "profiles" ? "id" : "user_id";
    const rows: unknown[] = [];
    for (let start = 0; start < 10000; start += 500) {
      const { data, error } = await supabase.from(table).select("*").eq(filter, user.id).range(start, start + 499);
      if (error) return new Response("Esportazione non disponibile. Riprova.", { status: 503, headers: { "Cache-Control": "no-store" } });
      rows.push(...(data ?? []));
      if (!data || data.length < 500) break;
      if (start === 9500) return new Response("Archivio troppo grande per l'esportazione diretta. Contatta il supporto.", { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    records[table] = rows;
  }

  const payload = JSON.stringify({ format: "insura-export-v1", exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email }, data: records }, null, 2);
  return new Response(payload, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="insura-dati.json"', "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
