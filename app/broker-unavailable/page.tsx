import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/(app)/actions";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { isBrokerPortalEnabled } from "@/lib/broker-portal-flags";
import { getOperationsIdentity } from "@/lib/operations-access";

export const metadata = {
  title: "Accesso sospeso | ATLAS",
  robots: { index: false, follow: false },
};

/**
 * Historical broker accounts keep role=broker in the DB.
 * When the Broker portal is hibernated they must not enter the workspace
 * and must not be silently treated as consumers.
 */
export default async function BrokerUnavailablePage() {
  const identity = await getOperationsIdentity();

  if (identity.user) {
    if (identity.role === "admin") redirect("/control-center");
    if (identity.role !== "broker") redirect("/dashboard");
    if (isBrokerPortalEnabled()) redirect("/broker/dashboard");
  }

  return (
    <AuthLayout
      title="Area operativa non disponibile"
      subtitle="L'area operativa dedicata ai partner è temporaneamente sospesa."
    >
      <div className="space-y-4 text-[13px] leading-relaxed text-muted">
        <p>
          {identity.user
            ? "Il tuo account professionale resta attivo e il tuo ruolo non cambia. Non hai accesso ai dossier di revisione degli utenti finché questa area non viene riattivata da ATLAS."
            : "I collegamenti storici dell'area partner non sono più attivi. ATLAS non offre un dashboard alternativo su questo indirizzo."}
        </p>
        <p>Per assistenza sul tuo account professionale, contatta il team ATLAS.</p>
        {identity.user ? (
          <form action={logout} className="pt-2">
            <button type="submit" className="atlas-btn-primary w-full py-2.5 text-[14px]">
              Esci
            </button>
          </form>
        ) : (
          <Link href="/login" className="atlas-btn-primary flex w-full justify-center py-2.5 text-[14px]">
            Accedi al tuo account
          </Link>
        )}
        <p className="text-center text-[12px]">
          <Link href="/" className="text-accent hover:text-accent-hover">
            Torna alla home
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
