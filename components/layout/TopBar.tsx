"use client";

import { IconBell, IconChevronDown, IconHelp } from "@/components/icons";
import { userProfile } from "@/lib/mock-data";
import { logout } from "@/app/(app)/actions";

export function TopBar() {
  const initials = userProfile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-slate-100 bg-white px-4 sm:px-6">
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label="Notifiche"
      >
        <IconBell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
      </button>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label="Aiuto"
      >
        <IconHelp className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        className="ml-1 flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 transition hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-medium text-slate-800 sm:inline">
          {userProfile.name.split(" ")[0]} B.
        </span>
        <IconChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
      </button>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        >
          Esci
        </button>
      </form>
    </header>
  );
}
