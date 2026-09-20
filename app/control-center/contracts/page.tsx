import {
  OperationsHeader,
  OperationsMetric,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { getAdminWorkspace } from "@/lib/admin-operations";
import { contractStatusLabel } from "@/lib/operations-labels";

export const metadata = { title: "Contratti | Control Center" };

export default async function ControlCenterContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ insurer?: string; category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminWorkspace();
  let contracts = data.contracts;
  if (params.insurer) {
    contracts = contracts.filter((c) =>
      String(c.insurer).toLowerCase().includes(params.insurer!.toLowerCase())
    );
  }
  if (params.category) {
    contracts = contracts.filter((c) =>
      String(c.category).toLowerCase().includes(params.category!.toLowerCase())
    );
  }
  if (params.status) {
    contracts = contracts.filter((c) => c.status === params.status);
  }

  return (
    <>
      <OperationsHeader
        eyebrow="Intermediazione"
        title="Contratti"
        description="Contratti intermediato ATLAS (distinti dalle polizze caricate dal consumer)."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <OperationsMetric label="Contratti filtrati" value={String(contracts.length)} />
        <OperationsMetric label="Attivi" value={String(contracts.filter((c) => c.status === "active").length)} />
        <OperationsMetric label="Totale piattaforma" value={String(data.contracts.length)} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2 text-[12px]">
        <input
          name="insurer"
          defaultValue={params.insurer ?? ""}
          placeholder="Assicuratore"
          className="rounded-lg border border-border bg-card px-3 py-2"
        />
        <input
          name="category"
          defaultValue={params.category ?? ""}
          placeholder="Categoria"
          className="rounded-lg border border-border bg-card px-3 py-2"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2"
        >
          <option value="">Tutti gli stati</option>
          <option value="active">Attivo</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Annullato</option>
        </select>
        <button className="rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground">
          Filtra
        </button>
      </form>
      <OperationsPanel title="Elenco">
        {!contracts.length ? (
          <p className="text-[12px] text-muted">Nessun contratto nel filtro.</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-lg border border-border p-3 text-[12px]">
                <p className="font-semibold">
                  {contract.insurer} · {contract.product}
                  <span className="float-right text-accent">
                    {contractStatusLabel(contract.status)}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {contract.category} · {formatDate(contract.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
