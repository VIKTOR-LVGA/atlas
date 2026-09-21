import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import { getCurrentProfile } from "@/lib/profiles";

export const metadata = { title: "Profilo Admin | Control Center" };

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "AT";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function ControlCenterProfilePage() {
  const { supabase, user } = await requireOperationsRole(["admin"]);
  const [profile, auditResult] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("platform_audit_log")
      .select("id, event_type, target_type, target_id, created_at")
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  const audit = auditResult.data ?? [];
  const displayName = profile?.fullName ?? user.user_metadata?.full_name ?? "Administrator";

  return (
    <>
      <OperationsHeader
        eyebrow="Account personale"
        title="Profilo Administrator"
        description="Identità, accesso ATLAS e sicurezza dell'account amministrativo."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <OperationsPanel title="Profilo">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-[18px] font-semibold text-accent">
              {initials(displayName, user.email)}
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-[11px] text-muted">{user.email ?? "—"}</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-[12px] sm:grid-cols-2">
            <div><dt className="text-muted">Nome</dt><dd>{displayName}</dd></div>
            <div><dt className="text-muted">Email</dt><dd>{user.email ?? "—"}</dd></div>
            <div><dt className="text-muted">Telefono</dt><dd>{profile?.phone ?? user.phone ?? "—"}</dd></div>
            <div><dt className="text-muted">Ruolo</dt><dd className="font-medium">Administrator</dd></div>
            <div><dt className="text-muted">Account creato</dt><dd>{formatDate(user.created_at)}</dd></div>
            <div><dt className="text-muted">Ultimo accesso</dt><dd>{formatDate(user.last_sign_in_at)}</dd></div>
          </dl>
        </OperationsPanel>

        <OperationsPanel title="ATLAS access">
          <dl className="grid gap-3 text-[12px]">
            <div><dt className="text-muted">Role server-side</dt><dd className="font-medium">admin</dd></div>
            <div><dt className="text-muted">Stato account</dt><dd className="font-medium text-[var(--success-text)]">Attivo</dd></div>
            <div><dt className="text-muted">Ultimo accesso Control Center</dt><dd>Non tracciato separatamente</dd></div>
            <div><dt className="text-muted">Sessione</dt><dd>Autenticata tramite Supabase Auth</dd></div>
          </dl>
        </OperationsPanel>

        <OperationsPanel title="Security">
          <div className="space-y-3 text-[12px]">
            <p className="text-muted">
              Il cambio password utilizza il flusso email verificato dell&apos;account.
            </p>
            <Link href="/forgot-password" className="atlas-btn-secondary inline-flex px-4 py-2">
              Cambia password
            </Link>
            <p className="rounded-lg border border-border bg-card-muted/40 p-3 text-[11px] text-muted">
              MFA non è ancora disponibile nell&apos;interfaccia ATLAS.
            </p>
            <p className="text-[11px] text-muted">
              Il logout è disponibile nel menu laterale del Control Center.
            </p>
          </div>
        </OperationsPanel>

        <OperationsPanel title="Ultimi eventi audit pertinenti">
          {!audit.length ? (
            <p className="text-[12px] text-muted">Nessun evento amministrativo registrato.</p>
          ) : (
            <ol className="space-y-3">
              {audit.map((event) => (
                <li key={event.id} className="border-l-2 border-border pl-3 text-[12px]">
                  <p className="font-medium">{event.event_type}</p>
                  <p className="text-[10px] text-muted">
                    {formatDate(event.created_at)} · {event.target_type}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </OperationsPanel>
      </div>
    </>
  );
}
