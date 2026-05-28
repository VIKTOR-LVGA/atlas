"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileProvider } from "@/components/profile/ProfileProvider";
import type { CurrentProfile } from "@/lib/types";

interface AppShellProps {
  profile: CurrentProfile | null;
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProfileProvider profile={profile}>
      <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-background lg:flex-row">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex w-full min-w-0 max-w-full flex-1 flex-col">
          <TopBar onMenuOpen={() => setMobileOpen(true)} />
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="atlas-contained mx-auto w-full px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-[1280px] sm:px-6 sm:py-8 sm:pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
