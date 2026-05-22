import type { CurrentProfile } from "@/lib/types";

export function getProfileDisplayName(profile: CurrentProfile | null) {
  return profile?.fullName?.trim() || profile?.email || "Utente Atlas";
}

export function getProfileShortName(profile: CurrentProfile | null) {
  const fullName = profile?.fullName?.trim();

  if (fullName) {
    return fullName.split(/\s+/)[0];
  }

  return profile?.email || "Account";
}

export function getProfileInitials(profile: CurrentProfile | null) {
  const segments = getProfileDisplayName(profile)
    .split(/[\s@._-]+/)
    .filter(Boolean);

  const initials = segments
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "AT";
}
