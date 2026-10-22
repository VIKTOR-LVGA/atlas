import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  // Only internal app paths are allowed. Never redirect to an external host.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("\\") ? nextParam : "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/login?oauth_error=missing_code",url.origin));
  try {
    const supabase = await getSupabaseServerClient();
    const {error} = await supabase.auth.exchangeCodeForSession(code);
    if(error) return NextResponse.redirect(new URL("/login?oauth_error=exchange_failed",url.origin));
    return NextResponse.redirect(new URL(next,url.origin));
  } catch {
    return NextResponse.redirect(new URL("/login?oauth_error=exchange_failed",url.origin));
  }
}
