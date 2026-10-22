import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
type EventType = "upload_ok" | "upload_failed" | "analysis_ok" | "analysis_failed";
export async function recordOperationalEvent(eventType: EventType, durationMs: number) {
  try {
    const client = await getSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    const safeDuration = Math.max(0, Math.min(3600000, Math.round(durationMs)));
    const { error } = await client.from("insura_operational_events").insert({
      user_id: user.id, event_type: eventType, duration_ms: safeDuration,
    });
    if (error) console.error("[insura:telemetry] write_failed");
  } catch { console.error("[insura:telemetry] unavailable"); }
}
