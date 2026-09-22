"use client";

import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
          Caricamento…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
