import Link from "next/link";
import { FileSignature } from "lucide-react";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { PartnerBadge, PartnerEmptyState } from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { contractStatusLabel } from "@/lib/operations-labels";

export const metadata = { title: "Contratti | Partner" };

const FILTERS = [
  ["all", "Tutti"],
  ["draft", "Bozza"],
  ["pending", "In attesa"],
  ["active", "Attivi"],
  ["cancelled", "Annullati"],
  ["expired", "Scaduti"],
] as const;

export default async function PartnerContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const { contracts, leads } = await getBrokerWorkspace();
  const filtered =
    status === "all"
      ? contracts
      : contracts.filter((row) => String(row.status) === status);

  return (
    <>
      <OperationsHeader
        eyebrow="Chiusure"
        title="Contratti"
        description="Contratti intermediato sui tuoi mandati."
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={
              value === "all" ? "/partner/contracts" : `/partner/contracts?status=${value}`
            }
            className={`rounded-lg border px-3 py-1.5 ${
              status === value
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <OperationsPanel title={`${filtered.length} contratti`}>
        {!filtered.length ? (
          <PartnerEmptyState
            icon={FileSignature}
            title="Nessun contratto"
            description="I contratti conclusi sui tuoi mandati appariranno qui."
            action={{ href: "/partner/leads", label: "Vai alle richieste" }}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((contract) => {
              const client = leads.find((lead) => lead.userId === contract.user_id);
              return (
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
                    {client?.clientName ?? "Cliente"} · {String(contract.insurer)} ·{" "}
                    {String(contract.product)}
                    <span className="float-right">
                      <PartnerBadge tone="accent">
                        {contractStatusLabel(String(contract.status))}
                      </PartnerBadge>
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {String(contract.category)}
                    {contract.contract_start_date
                      ? ` · decorrenza ${formatDate(String(contract.contract_start_date))}`
                      : ""}{" "}
                    · {formatDate(String(contract.created_at))}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
