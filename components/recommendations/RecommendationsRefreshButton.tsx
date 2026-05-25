"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RecommendationsRefreshButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="atlas-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-[12px]"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Aggiorna
    </button>
  );
}
