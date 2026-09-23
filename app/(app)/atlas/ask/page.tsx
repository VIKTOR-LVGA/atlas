import Link from "next/link";
import { notFound } from "next/navigation";
import { AskAtlasPanel } from "@/components/insurance-os/AskAtlasPanel";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Chiedi ad ATLAS" };

export default async function AskAtlasPage() {
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
          Chiedi ad ATLAS
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Domande sulla tua situazione, non sul mercato. ATLAS risponde partendo dai
          documenti che hai caricato e indica sempre la fonte.
        </p>
      </header>

      <AskAtlasPanel hasPolicies={policies.length > 0} />
    </div>
  );
}
