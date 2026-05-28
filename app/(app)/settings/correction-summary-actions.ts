"use server";

import "server-only";

import { getUserCorrectionSummary } from "@/lib/correction-insights";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function loadSavedCorrectionsSummary() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getUserCorrectionSummary(user.id);
}
