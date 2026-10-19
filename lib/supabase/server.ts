import "server-only";

import { cache } from "react";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookieOptions: {
      secure: (await headers()).get("x-forwarded-proto") === "https" || process.env.VERCEL === "1",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; proxy.ts handles refreshes.
        }
      },
    },
  });
}

/**
 * One verified Supabase auth lookup per React server render request.
 * The cache is request-scoped, not process-global: credentials and user data
 * are never shared across users or requests. Keep mutation paths uncached.
 */
export const getCurrentRequestAuth = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
});
