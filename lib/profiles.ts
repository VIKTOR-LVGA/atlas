import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type {
  CurrentProfile,
  CurrentProfileUpdate,
  ProfileCurrency,
  ProfileDateFormat,
  ProfileLanguage,
} from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const profileSelect =
  "id, full_name, email, avatar_url, phone, language, currency, date_format, notification_email, notification_push, notification_sms, created_at, updated_at";
const profileLanguages = ["it", "de", "fr", "en"] as const;
const profileDateFormats = ["DD/MM/YYYY", "YYYY-MM-DD"] as const;

export class ProfileUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileUpdateError";
  }
}

function isProfileLanguage(value: string | null): value is ProfileLanguage {
  return profileLanguages.includes(value as ProfileLanguage);
}

function getProfileLanguage(value: string | null): ProfileLanguage {
  return isProfileLanguage(value) ? value : "it";
}

function getProfileCurrency(value: string | null): ProfileCurrency {
  return value === "CHF" ? value : "CHF";
}

function getProfileDateFormat(value: string | null): ProfileDateFormat {
  return profileDateFormats.includes(value as ProfileDateFormat)
    ? (value as ProfileDateFormat)
    : "DD/MM/YYYY";
}

function toProfile(
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
    language: string | null;
    currency: string | null;
    date_format: string | null;
    notification_email: boolean | null;
    notification_push: boolean | null;
    notification_sms: boolean | null;
    created_at: string;
    updated_at: string;
  },
  fallbackProfile: CurrentProfile
): CurrentProfile {
  return {
    id: profile.id,
    fullName: profile.full_name ?? fallbackProfile.fullName,
    email: profile.email ?? fallbackProfile.email,
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
    language: getProfileLanguage(profile.language),
    currency: getProfileCurrency(profile.currency),
    dateFormat: getProfileDateFormat(profile.date_format),
    notificationEmail: profile.notification_email ?? true,
    notificationPush: profile.notification_push ?? true,
    notificationSms: profile.notification_sms ?? false,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    hasProfileRow: true,
  };
}

function assertCurrentProfileUpdate(input: CurrentProfileUpdate) {
  if (!input.fullName.trim()) {
    throw new ProfileUpdateError("Il nome completo e obbligatorio.");
  }

  if (!isProfileLanguage(input.language)) {
    throw new ProfileUpdateError("Lingua non valida.");
  }

  if (input.currency !== "CHF") {
    throw new ProfileUpdateError("Valuta non valida.");
  }

  if (!profileDateFormats.includes(input.dateFormat)) {
    throw new ProfileUpdateError("Formato data non valido.");
  }
}

function getAuthFallbackProfile(user: User): CurrentProfile {
  const metadataFullName = user.user_metadata?.full_name;

  return {
    id: user.id,
    fullName: typeof metadataFullName === "string" ? metadataFullName : null,
    email: user.email ?? null,
    avatarUrl: null,
    phone: null,
    language: "it",
    currency: "CHF",
    dateFormat: "DD/MM/YYYY",
    notificationEmail: true,
    notificationPush: true,
    notificationSms: false,
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
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return fallbackProfile;
  }

  return toProfile(profile, fallbackProfile);
});

export async function updateCurrentProfile(input: CurrentProfileUpdate) {
  assertCurrentProfileUpdate(input);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ProfileUpdateError("Accedi di nuovo per salvare le impostazioni.");
  }

  const fallbackProfile = getAuthFallbackProfile(user);
  const profileUpdate = {
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    language: input.language,
    currency: input.currency,
    date_format: input.dateFormat,
    notification_email: input.notificationEmail,
    notification_push: input.notificationPush,
    notification_sms: input.notificationSms,
  };

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)
    .select(profileSelect)
    .maybeSingle();

  if (updateError) {
    throw new ProfileUpdateError("Salvataggio profilo non riuscito.");
  }

  if (updatedProfile) {
    return toProfile(updatedProfile, fallbackProfile);
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      ...profileUpdate,
    })
    .select(profileSelect)
    .single();

  if (insertError || !insertedProfile) {
    throw new ProfileUpdateError("Profilo non disponibile. Riprova tra poco.");
  }

  return toProfile(insertedProfile, fallbackProfile);
}
