"use client";

import { createContext, useContext } from "react";
import type { CurrentProfile } from "@/lib/types";

const CurrentProfileContext = createContext<CurrentProfile | null>(null);

export function ProfileProvider({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: CurrentProfile | null;
}) {
  return (
    <CurrentProfileContext.Provider value={profile}>
      {children}
    </CurrentProfileContext.Provider>
  );
}

export function useCurrentProfile() {
  return useContext(CurrentProfileContext);
}
