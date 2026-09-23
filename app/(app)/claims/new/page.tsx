import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimWizard } from "@/components/insurance-os/ClaimWizard";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";

export const metadata = { title: "Nuovo dossier sinistro" };

export default async function NewClaimPage() {
  if (!isIosFeatureEnabled("claims")) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/claims" className="text-[12px] font-medium text-muted hover:text-foreground">
          Sinistri
        </Link>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          Prepariamo il dossier
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Tre passaggi brevi. Puoi completare tutto anche in un secondo momento.
        </p>
      </header>

      <ClaimWizard />
    </div>
  );
}
