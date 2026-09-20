import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { getAdminUserDirectory } from "@/lib/control-center-operations";
import { cantonLabel } from "@/lib/swiss-cantons";

export const metadata = { title: "Utenti | Control Center" };

export default async function ControlCenterUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const users = await getAdminUserDirectory(params.q, params.role);

  return (
    <>
      <OperationsHeader
        eyebrow="Directory"
        title="Utenti piattaforma"
        description="Elenco operativo senza contenuti documentali. I PDF restano fuori da questa vista."
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cerca nome o email"
          className="rounded-lg border border-border bg-card px-3 py-2 text-[12px]"
        />
        <select
          name="role"
          defaultValue={params.role ?? "all"}
          className="rounded-lg border border-border bg-card px-3 py-2 text-[12px]"
        >
          <option value="all">Tutti i ruoli</option>
          <option value="consumer">Consumer</option>
          <option value="broker">Partner</option>
          <option value="admin">Admin</option>
        </select>
        <button className="rounded-lg bg-accent px-3 py-2 text-[12px] font-medium text-accent-foreground">
          Filtra
        </button>
      </form>
      <OperationsPanel title={`${users.length} utenti`}>
        {!users.length ? (
          <p className="text-[12px] text-muted">Nessun utente nel filtro corrente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="text-[10px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">Utente</th>
                  <th className="pb-3">Ruolo</th>
                  <th className="pb-3">Registrazione</th>
                  <th className="pb-3">Polizze</th>
                  <th className="pb-3">Documenti</th>
                  <th className="pb-3">Consulenze</th>
                  <th className="pb-3">Cantone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="py-3">
                      <Link
                        href={`/control-center/users/${user.user_id}`}
                        className="font-semibold text-accent"
                      >
                        {user.full_name ?? "Utente ATLAS"}
                      </Link>
                      <p className="text-[10px] text-muted">{user.email}</p>
                    </td>
                    <td>{user.role}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{user.policies_count}</td>
                    <td>{user.documents_count}</td>
                    <td>{user.consultations_count}</td>
                    <td>{cantonLabel(user.primary_canton ?? "UNKNOWN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
