import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckupView } from "@/components/insurance-os/CheckupView";
import { getLatestCheckup } from "@/lib/insurance-os/checkup";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { getCurrentUserPolicies } from "@/lib/policies";

export const metadata = { title: "Check-up" };

export default async function CheckupPage() {
  if (!isIosFeatureEnabled("annual_checkup")) {
    notFound();
  }

  const [policies, latest] = await Promise.all([
    getCurrentUserPolicies(),
    getLatestCheckup(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/atlas" className="text-[12px] font-medium text-muted hover:text-foreground">
          ATLAS
        </Link>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          Check-up del portafoglio
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Una revisione completa e ripetibile. Serve a capire, non a comprare.
        </p>
      </header>

      <CheckupView initial={latest} canRun={policies.length > 0} />
    </div>
  );
}
