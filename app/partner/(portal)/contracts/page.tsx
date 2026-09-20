import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { contractStatusLabel } from "@/lib/operations-labels";

export const metadata = { title: "Contratti | Partner" };

export default async function PartnerContractsPage() {
  const { contracts } = await getBrokerWorkspace();

  return (
    <>
      <OperationsHeader
        eyebrow="Chiusure"
        title="Contratti"
        description="Contratti intermediato sui tuoi mandati."
      />
      <OperationsPanel title={`${contracts.length} contratti`}>
        {!contracts.length ? (
          <p className="text-[12px] text-muted">Nessun contratto concluso.</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((contract) => (
              <Link
                key={String(contract.id)}
                href={
                  contract.consultation_request_id
                    ? `/partner/leads/${contract.consultation_request_id}`
                    : "/partner/contracts"
                }
                className="block rounded-lg border border-border p-3 text-[12px] hover:border-accent"
              >
                <p className="font-semibold">
                  {String(contract.insurer)} · {String(contract.product)}
                  <span className="float-right text-accent">
                    {contractStatusLabel(String(contract.status))}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {String(contract.category)} · {formatDate(String(contract.created_at))}
                </p>
              </Link>
            ))}
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
