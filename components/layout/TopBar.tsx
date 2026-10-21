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
    <header className="relative z-40 flex h-[68px] w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-[#e9eef7] bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:h-[74px] lg:px-10">
      <Link href="/dashboard" className="flex min-w-0 items-center lg:hidden">
        <AtlasBrandLogo variant="stacked" compact />
      </Link>

      <Link href="/policies" className="hidden text-[13px] font-semibold text-muted-foreground hover:text-foreground lg:block">Il tuo portafoglio assicurativo</Link>
      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
        <ThemeToggle />
        <TopBarHelpMenuMobile />
        <TopBarNotificationsMenu />
        <TopBarHelpMenu />
        <TopBarProfileMenu />
      </div>
    </header>
  );
}
