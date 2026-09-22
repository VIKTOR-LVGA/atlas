import { redirect } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { IntelligenceApplyForm } from "@/components/intelligence/IntelligenceApplyForm";
import { getOperationsIdentity } from "@/lib/operations-access";
import {
  getLatestIntelligenceApplication,
  hasIntelligenceAccess,
} from "@/lib/intelligence-access";

export const metadata = {
  title: "Richiedi accesso ad ATLAS Intelligence",
  description:
    "Candidatura B2B per ATLAS Intelligence. Verifica aziendale obbligatoria prima dell'attivazione.",
};

export default async function IntelligenceApplyPage() {
  const identity = await getOperationsIdentity();

  if (identity.user && (await hasIntelligenceAccess())) {
    redirect("/intelligence/dashboard");
  }

  if (identity.user) {
    const existing = await getLatestIntelligenceApplication(identity.user.id);
    if (
      existing &&
      ["submitted", "under_review", "approved"].includes(existing.status)
    ) {
      redirect("/intelligence/apply/status");
    }
  }

  const fullName = identity.user?.user_metadata?.full_name
    ? String(identity.user.user_metadata.full_name)
    : "";
  const [firstName, ...rest] = fullName.trim().split(/\s+/).filter(Boolean);

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
          ATLAS Intelligence
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-[var(--landing-text)]">
          Richiedi accesso ad ATLAS Intelligence
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-muted)]">
          Raccontaci chi sei e come vorresti utilizzare gli insight ATLAS. Ogni richiesta
          viene verificata prima dell&apos;attivazione.
        </p>
        <IntelligenceApplyForm
          isAuthenticated={Boolean(identity.user)}
          prefill={{
            firstName: firstName || undefined,
            lastName: rest.length ? rest.join(" ") : undefined,
            email: identity.user?.email ?? undefined,
          }}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
