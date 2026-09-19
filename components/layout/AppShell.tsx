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
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background lg:flex-row">
        <Sidebar />
        <div className="flex w-full min-w-0 max-w-full flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="atlas-contained mx-auto w-full max-w-[1120px] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:pb-10">
              {children}
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </ProfileProvider>
  );
}
