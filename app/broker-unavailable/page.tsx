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
  if (!identity.user) redirect("/login");

  if (identity.role === "admin") redirect("/control-center");
  if (identity.role !== "broker") redirect("/dashboard");
  if (isBrokerPortalEnabled()) redirect("/broker/dashboard");

  return (
    <AuthLayout
      title="Area operativa non disponibile"
      subtitle="Il tuo account professionale resta attivo, ma l'area operativa dedicata è temporaneamente sospesa."
    >
      <div className="space-y-4 text-[13px] leading-relaxed text-muted">
        <p>
          Non stiamo modificando il tuo ruolo. Non hai accesso ai dossier di revisione
          degli utenti finché questa area non viene riattivata da ATLAS.
        </p>
        <p>Per assistenza sul tuo account professionale, contatta il team ATLAS.</p>
        <form action={logout} className="pt-2">
          <button type="submit" className="atlas-btn-primary w-full py-2.5 text-[14px]">
            Esci
          </button>
        </form>
        <p className="text-center text-[12px]">
          <Link href="/" className="text-accent hover:text-accent-hover">
            Torna alla home
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
