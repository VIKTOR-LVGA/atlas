"use client";

import Link from "next/link";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import { IconMenu } from "@/components/icons";
import {
  TopBarHelpMenu,
  TopBarHelpMenuMobile,
  TopBarNotificationsMenu,
  TopBarProfileMenu,
} from "@/components/layout/TopBarMenus";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TopBarProps {
  onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  return (
    <header className="relative z-40 flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-sm sm:gap-3 sm:px-5 lg:justify-end">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onMenuOpen}
          className="atlas-icon-button shrink-0 rounded-lg p-2 text-muted hover:bg-card-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Apri menu"
        >
          <IconMenu />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center">
          <AtlasBrandLogo variant="stacked" compact />
        </Link>
      </div>

      <div className="flex min-w-0 shrink items-center justify-end gap-1.5 overflow-visible sm:gap-2">
        <ThemeToggle />
        <TopBarHelpMenuMobile />
        <TopBarNotificationsMenu />
        <TopBarHelpMenu />
        <TopBarProfileMenu />
      </div>
    </header>
  );
}
