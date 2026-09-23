import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimList } from "@/components/insurance-os/ClaimList";
import { listCurrentUserClaims } from "@/lib/insurance-os/claims";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";

export const metadata = { title: "Sinistri" };

export default async function ClaimsPage() {
  if (!isIosFeatureEnabled("claims")) {
    notFound();
  }

  const claims = await listCurrentUserClaims();
  const open = claims.filter((claim) => claim.status !== "closed");
  const closed = claims.filter((claim) => claim.status === "closed");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
            Sinistri
          </h1>
          <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
            Quando succede qualcosa, ATLAS ti dice cosa serve e prepara il dossier. La
            denuncia la invii tu.
          </p>
        </div>
        <Link href="/claims/new" className="atlas-btn-primary min-h-11 px-4 text-[13px]">
          Nuovo dossier
        </Link>
      </header>

      <section>
        <h2 className="atlas-section-eyebrow">In corso</h2>
        <div className="mt-3">
          <ClaimList claims={open} />
        </div>
      </section>

      {closed.length > 0 ? (
        <section>
          <h2 className="atlas-section-eyebrow">Chiusi</h2>
          <div className="mt-3">
            <ClaimList claims={closed} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
