import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatIfPanel } from "@/components/insurance-os/WhatIfPanel";
import { EmptyState } from "@/components/consumer/EmptyState";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "E se succedesse" };

export default async function WhatIfPage() {
  if (!isIosFeatureEnabled("ask_atlas")) {
    notFound();
  }

  const policies = await getCurrentUserPolicies();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/atlas" className="text-[12px] font-medium text-muted hover:text-foreground">
          ATLAS
        </Link>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          E se succedesse…
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Prova uno scenario prima che accada. ATLAS mostra quali polizze potrebbero entrare
          in gioco, cosa risulta dalle condizioni e cosa resta da verificare.
        </p>
      </header>

      {policies.length === 0 ? (
        <EmptyState
          title="Serve almeno una polizza."
          description="Gli scenari hanno senso solo se ATLAS può confrontarli con i tuoi documenti reali."
          actionLabel="Carica un documento"
          actionHref="/documents"
        />
      ) : (
        <WhatIfPanel />
      )}
    </div>
  );
}
