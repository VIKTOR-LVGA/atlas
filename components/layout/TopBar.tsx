"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
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
    <header className="relative z-40 flex h-[68px] w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 backdrop-blur-xl sm:px-7 lg:h-[80px] lg:px-10">
      <Link href="/dashboard" className="flex min-w-0 items-center lg:hidden">
        <AtlasBrandLogo variant="stacked" compact />
      </Link>

      <Link href="/policies" className="hidden text-[13px] font-semibold text-muted-foreground hover:text-foreground lg:block">Il tuo portafoglio assicurativo</Link>
      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
        <Link href="/documents" className="atlas-btn-primary mr-2 hidden items-center gap-2 px-3.5 text-[12px] sm:inline-flex">
          <Plus className="h-3.5 w-3.5" aria-hidden /> Carica PDF
        </Link>
        <ThemeToggle />
        <TopBarHelpMenuMobile />
        <TopBarNotificationsMenu />
        <TopBarHelpMenu />
        <TopBarProfileMenu />
      </div>
    </header>
  );
}
