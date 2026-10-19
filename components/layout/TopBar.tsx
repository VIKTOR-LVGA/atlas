"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
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

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <span className="text-[12px] font-semibold text-muted">Il tuo portafoglio assicurativo</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden />
      </div>
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
