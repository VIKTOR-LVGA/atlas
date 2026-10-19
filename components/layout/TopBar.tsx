"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
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

      <form action="/search" method="GET" role="search" className="hidden w-full max-w-[480px] items-center gap-2 rounded-[18px] bg-card-muted px-4 py-2.5 lg:flex">
        <Search className="h-[18px] w-[18px] shrink-0 text-[#6e7f9c]" aria-hidden/>
        <input type="search" name="q" maxLength={80} aria-label="Cerca polizze e documenti" placeholder="Cerca polizze, documenti..." className="w-full min-w-0 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted"/>
      </form>
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
