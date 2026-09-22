import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily Intelligence snapshot refresh.
 * Secured by CRON_SECRET (Authorization: Bearer <secret> or ?secret=).
 * Prefer Vercel Cron hitting this route if pg_cron is unavailable.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const url = new URL(request.url);
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const querySecret = url.searchParams.get("secret") ?? "";
  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "supabase not configured" },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const started = Date.now();
  const { data, error } = await supabase.rpc("refresh_intelligence_snapshots", {
    p_trigger_source: "cron",
    p_period_days: 365,
  });

  if (error) {
    console.error("[cron/intelligence-snapshots]", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        duration_ms: Date.now() - started,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    run_id: data,
    duration_ms: Date.now() - started,
  });
}
