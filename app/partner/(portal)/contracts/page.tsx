import Link from "next/link";
import {
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerEmptyState,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
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
  const pending = contracts.filter((row) =>
    ["draft", "pending"].includes(String(row.status))
  ).length;

  return (
    <>
      <PartnerPageIntro
        area="contracts"
        eyebrow="Chiusure"
        title="Contratti"
        description="Contratti intermediato sui tuoi mandati."
        actions={
          pending > 0 ? (
            <PartnerBadge tone="warn">{pending} da finalizzare</PartnerBadge>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={
              value === "all" ? "/partner/contracts" : `/partner/contracts?status=${value}`
            }
            className={`rounded-lg border px-3.5 py-1.5 transition ${
              status === value
                ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
                : "border-border text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <OperationsPanel title={`${filtered.length} contratti`}>
        {!filtered.length ? (
          <PartnerEmptyState
            area="contracts"
            title="Nessun contratto"
            description="I contratti conclusi sui tuoi mandati appariranno qui."
            action={{ href: "/partner/leads", label: "Vai alle richieste" }}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((contract) => {
              const client = leads.find((lead) => lead.userId === contract.user_id);
              const needsAction = ["draft", "pending"].includes(String(contract.status));
              return (
                <Link
                  key={String(contract.id)}
                  href={
                    contract.consultation_request_id
                      ? `/partner/leads/${contract.consultation_request_id}`
                      : "/partner/contracts"
                  }
                  className="block rounded-xl border border-border bg-card p-3.5 text-[12px] transition hover:border-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">
                      {client?.clientName ?? "Cliente"} · {String(contract.insurer)} ·{" "}
                      {String(contract.product)}
                    </p>
                    <PartnerBadge tone={needsAction ? "warn" : "accent"}>
                      {contractStatusLabel(String(contract.status))}
                    </PartnerBadge>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted">
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
