import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response("Non autorizzato", { status: 401, headers: { "Cache-Control": "no-store" } });

  const tables = ["profiles", "policies", "documents", "extraction_corrections", "insura_chat_history"] as const;
  const records: Record<string, unknown> = {};
  for (const table of tables) {
    const filter = table === "profiles" ? "id" : "user_id";
    const { data, error } = await supabase.from(table).select("*").eq(filter, user.id);
    if (error) return new Response("Esportazione non disponibile. Riprova.", { status: 503, headers: { "Cache-Control": "no-store" } });
    records[table] = data ?? [];
  }

  const payload = JSON.stringify({ format: "insura-export-v1", exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email }, data: records }, null, 2);
  return new Response(payload, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="insura-dati.json"', "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
