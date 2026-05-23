"use client";

import { IconBell, IconChevronDown, IconHelp } from "@/components/icons";
import { logout } from "@/app/(app)/actions";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { getProfileInitials, getProfileShortName } from "@/lib/profile-display";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function TopBar() {
  const profile = useCurrentProfile();

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border bg-card px-4 sm:gap-3 sm:px-6">
      <ThemeToggle />
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-card-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Notifiche"
      >
        <IconBell className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-card-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex"
        aria-label="Aiuto"
      >
        <IconHelp className="h-[18px] w-[18px]" />
      </button>
      <div className="ml-1 flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-semibold text-white">
          {getProfileInitials(profile)}
        </span>
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          {getProfileShortName(profile)}
        </span>
        <IconChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" />
      </div>
      <form action={logout}>
        <button type="submit" className="atlas-btn-secondary text-[12px]">
          Esci
        </button>
      </form>
    </header>
  );
}
