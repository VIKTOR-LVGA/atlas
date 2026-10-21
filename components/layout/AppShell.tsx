"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import type { CurrentProfile } from "@/lib/types";

interface AppShellProps {
  profile: CurrentProfile | null;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <ProfileProvider profile={profile}>
      <div className="atlas-app-canvas flex min-h-screen w-full min-w-0 lg:flex-row">
        <Sidebar />
        <div className="flex w-full min-w-0 max-w-full flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="atlas-contained mx-auto w-full max-w-[1160px] px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pt-7 lg:px-6 lg:pb-10 lg:pt-6 xl:px-9">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </ProfileProvider>
  );
}
