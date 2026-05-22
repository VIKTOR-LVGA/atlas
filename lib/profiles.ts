import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { CurrentProfile } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getAuthFallbackProfile(user: User): CurrentProfile {
  const metadataFullName = user.user_metadata?.full_name;

  return {
    id: user.id,
    fullName: typeof metadataFullName === "string" ? metadataFullName : null,
    email: user.email ?? null,
    avatarUrl: null,
    createdAt: null,
    updatedAt: null,
    hasProfileRow: false,
  };
}

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const fallbackProfile = getAuthFallbackProfile(user);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return fallbackProfile;
  }

  return {
    id: profile.id,
    fullName: profile.full_name ?? fallbackProfile.fullName,
    email: profile.email ?? fallbackProfile.email,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    hasProfileRow: true,
  };
});
