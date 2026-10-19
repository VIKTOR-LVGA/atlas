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
      <header className="atlas-consumer-hero p-6 sm:p-8">
        <Link href="/atlas" className="text-[12px] font-semibold text-accent hover:underline">← ATLAS</Link>
        <p className="atlas-premium-eyebrow mt-5">Il tuo assistente</p>
        <h1 className="atlas-premium-title mt-2">Cosa vuoi sapere?</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          Chiedi in parole semplici. ATLAS cerca le informazioni nel tuo portafoglio e indica le fonti disponibili.
        </p>
      </header>

      <AskAtlasPanel hasPolicies={policies.length > 0} />
    </div>
  );
}
