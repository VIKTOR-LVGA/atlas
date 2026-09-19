"use client";

import Link from "next/link";
import { AtlasBrandLogo } from "@/components/brand/AtlasBrandLogo";
import {
  TopBarHelpMenu,
  TopBarHelpMenuMobile,
  TopBarNotificationsMenu,
  TopBarProfileMenu,
} from "@/components/layout/TopBarMenus";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function TopBar() {
  return (
    <header className="relative z-40 flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-5 lg:h-16 lg:justify-end">
      <Link href="/dashboard" className="flex min-w-0 items-center lg:hidden">
        <AtlasBrandLogo variant="stacked" compact />
      </Link>

      <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1.5">
        <ThemeToggle />
        <TopBarHelpMenuMobile />
        <TopBarNotificationsMenu />
        <TopBarHelpMenu />
        <TopBarProfileMenu />
      </div>
    </header>
  );
}
