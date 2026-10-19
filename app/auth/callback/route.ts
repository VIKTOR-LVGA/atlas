import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Auth code exchange; never accepts an external post-login redirect. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  const requestedNext = request.nextUrl.searchParams.get("next");
  const destination = requestedNext === "/reset-password" ? "/reset-password" : getSafeAuthRedirect(requestedNext);
  return NextResponse.redirect(new URL(destination, request.url));
}
