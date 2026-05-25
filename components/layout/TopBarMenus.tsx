"use client";

import {
  BookOpen,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
} from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { useCurrentProfile } from "@/components/profile/ProfileProvider";
import { IconBell, IconChevronDown, IconHelp } from "@/components/icons";
import {
  TopBarPopover,
  TopBarPopoverDivider,
  TopBarPopoverHeader,
  TopBarPopoverItem,
  TopBarPopoverNote,
} from "@/components/ui/TopBarPopover";
import { getProfileInitials, getProfileShortName } from "@/lib/profile-display";
import { cn } from "@/lib/utils";

const iconTriggerClass =
  "atlas-icon-button flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-card-muted hover:text-foreground";

export function TopBarNotificationsMenu() {
  return (
    <TopBarPopover
      ariaLabel="Notifiche"
      align="end"
      panelClassName="max-w-[min(100vw-1rem,18rem)]"
      trigger={
        <span className={iconTriggerClass}>
          <IconBell className="h-[18px] w-[18px]" />
        </span>
      }
    >
      <TopBarPopoverHeader>
        <span className="text-[12px] font-semibold text-foreground">Notifiche</span>
      </TopBarPopoverHeader>
      <TopBarPopoverNote>
        Le notifiche automatiche saranno disponibili prossimamente.
      </TopBarPopoverNote>
      <TopBarPopoverDivider />
      <TopBarPopoverItem href="/recommendations">
        <Target className="h-3.5 w-3.5 text-accent" />
        Vai alle raccomandazioni
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/settings">
        <Settings className="h-3.5 w-3.5" />
        Preferenze notifiche
      </TopBarPopoverItem>
    </TopBarPopover>
  );
}

function HelpMenuPanel() {
  return (
    <>
      <TopBarPopoverHeader>
        <span className="text-[12px] font-semibold text-foreground">Aiuto</span>
      </TopBarPopoverHeader>
      <TopBarPopoverItem href="/">
        <BookOpen className="h-3.5 w-3.5" />
        Come funziona Atlas
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/documents">
        <FileText className="h-3.5 w-3.5" />
        Documenti
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/recommendations">
        <Target className="h-3.5 w-3.5" />
        Raccomandazioni
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/settings">
        <Settings className="h-3.5 w-3.5" />
        Impostazioni
      </TopBarPopoverItem>
      <TopBarPopoverDivider />
      <TopBarPopoverNote>Supporto diretto in preparazione.</TopBarPopoverNote>
    </>
  );
}

export function TopBarHelpMenu() {
  return (
    <TopBarPopover
      ariaLabel="Aiuto"
      align="end"
      panelClassName="max-w-[min(100vw-1rem,16rem)]"
      trigger={
        <span className={cn(iconTriggerClass, "hidden sm:flex")}>
          <IconHelp className="h-[18px] w-[18px]" />
        </span>
      }
    >
      <HelpMenuPanel />
    </TopBarPopover>
  );
}

export function TopBarHelpMenuMobile() {
  return (
    <TopBarPopover
      ariaLabel="Aiuto"
      align="end"
      panelClassName="max-w-[min(100vw-1rem,16rem)]"
      trigger={
        <span className={cn(iconTriggerClass, "sm:hidden")}>
          <HelpCircle className="h-[18px] w-[18px]" />
        </span>
      }
    >
      <HelpMenuPanel />
    </TopBarPopover>
  );
}

export function TopBarProfileMenu() {
  const profile = useCurrentProfile();

  return (
    <TopBarPopover
      ariaLabel="Menu account"
      align="end"
      panelClassName="max-w-[min(100vw-1rem,15rem)]"
      trigger={
        <span
          className={cn(
            "ml-0.5 flex shrink-0 items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 transition hover:bg-card-muted"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-semibold text-white">
            {getProfileInitials(profile)}
          </span>
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:inline">
            {getProfileShortName(profile)}
          </span>
          <IconChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" />
        </span>
      }
    >
      {profile?.email ? (
        <>
          <TopBarPopoverHeader>
            <span className="block truncate font-medium text-foreground">
              {profile.email}
            </span>
          </TopBarPopoverHeader>
          <TopBarPopoverDivider />
        </>
      ) : null}
      <TopBarPopoverItem href="/dashboard">
        <LayoutDashboard className="h-3.5 w-3.5" />
        Dashboard
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/documents">
        <FileText className="h-3.5 w-3.5" />
        Documenti
      </TopBarPopoverItem>
      <TopBarPopoverItem href="/settings">
        <Settings className="h-3.5 w-3.5" />
        Impostazioni
      </TopBarPopoverItem>
      <TopBarPopoverDivider />
      <form action={logout}>
        <button
          type="submit"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[12px] font-medium text-foreground transition hover:bg-card-muted"
        >
          <LogOut className="h-3.5 w-3.5" />
          Esci
        </button>
      </form>
    </TopBarPopover>
  );
}
