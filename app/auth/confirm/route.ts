import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Token-hash confirmation endpoint for Supabase SSR email templates. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (tokenHash && (type === "email" || type === "recovery")) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) {
      const destination = type === "recovery" ? "/reset-password" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
}
