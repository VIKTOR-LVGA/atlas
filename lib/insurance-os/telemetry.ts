import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProductEventName =
  | "coverage_map_opened"
  | "ask_atlas_question"
  | "what_if_started"
  | "checkup_started"
  | "checkup_completed"
  | "claim_started"
  | "claim_completed"
  | "consultation_requested";

/**
 * Privacy-safe telemetry. Never send question/event text.
 */
export async function trackProductEvent(
  eventName: ProductEventName,
  metadata?: Record<string, string | number | boolean | null>
) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const safeMeta: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata ?? {})) {
      if (["question", "description", "content", "message", "scenario"].includes(key)) {
        continue;
      }
      safeMeta[key] = value;
    }

    await supabase.from("atlas_product_events").insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      route: typeof metadata?.route === "string" ? metadata.route : null,
      metadata: safeMeta,
    });
  } catch {
    /* telemetry must never break product flows */
  }
}
