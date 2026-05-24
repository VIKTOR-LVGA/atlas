"use client";

import Link from "next/link";
import { IconBell, IconChevronDown, IconHelp, IconLogo, IconMenu } from "@/components/icons";
import { logout } from "@/app/(app)/actions";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { getProfileInitials, getProfileShortName } from "@/lib/profile-display";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TopBarProps {
  onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const profile = useCurrentProfile();

  return (
    <header className="flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b border-border bg-card/80 px-3 backdrop-blur-sm sm:gap-3 sm:px-5 lg:justify-end">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onMenuOpen}
          className="atlas-icon-button shrink-0 rounded-lg p-2 text-muted hover:bg-card-muted hover:text-foreground"
          aria-label="Apri menu"
        >
          <IconMenu />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <IconLogo className="h-8 w-8 shrink-0" />
          <span className="truncate text-sm font-semibold text-foreground">Atlas</span>
        </Link>
      </div>

      <div className="flex min-w-0 shrink items-center justify-end gap-1.5 sm:gap-3">
        <ThemeToggle />
        <button
          type="button"
          className="atlas-icon-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-card-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Notifiche"
        >
          <IconBell className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="atlas-icon-button hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-card-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:flex"
          aria-label="Aiuto"
        >
          <IconHelp className="h-[18px] w-[18px]" />
        </button>
        <div className="ml-0.5 flex shrink-0 items-center gap-2 rounded-lg py-1.5 pl-1 pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-semibold text-white">
            {getProfileInitials(profile)}
          </span>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {getProfileShortName(profile)}
          </span>
          <IconChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" />
        </div>
        <form action={logout} className="shrink-0">
          <button type="submit" className="atlas-btn-secondary text-[12px]">
            Esci
          </button>
        </form>
      </div>
    </header>
  );
}
