import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Stato candidatura | ATLAS Intelligence" };

export default async function IntelligenceStatusPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fintelligence%2Fstatus");

  const { data: application } = await supabase
    .from("intelligence_applications")
    .select("status, company_name, created_at, rejection_reason")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!application) {
    redirect("/intelligence/apply");
  }

  const heading =
    application.status === "approved"
      ? "Approvata"
      : application.status === "rejected"
        ? "Non approvata"
        : application.status === "under_review"
          ? "In revisione"
          : "Inviata";

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-accent-bright)]">
          ATLAS Intelligence
        </p>
        <h1 className="mt-3 text-[28px] font-semibold text-[var(--landing-text)]">
          {heading}
        </h1>
        <p className="mt-3 text-[14px] text-[var(--landing-muted)]">
          {application.company_name}
          {application.rejection_reason
            ? ` — ${application.rejection_reason}`
            : " · nessun accesso automatico ai dati consumer."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {application.status === "approved" ? (
            <Link href="/intelligence/dashboard" className="landing-btn-gradient">
              Apri Intelligence
            </Link>
          ) : (
            <Link href="/intelligence" className="landing-btn-ghost">
              Torna alla overview
            </Link>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
