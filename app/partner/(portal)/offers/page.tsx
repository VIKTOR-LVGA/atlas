import Link from "next/link";
import {
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import {
  PartnerBadge,
  PartnerEmptyState,
  PartnerPageIntro,
} from "@/components/partner/PartnerEmptyState";
import { getBrokerWorkspace } from "@/lib/broker-operations";
import { offerStatusLabel } from "@/lib/operations-labels";

export const metadata = { title: "Offerte | Partner" };

const FILTERS = [
  ["all", "Tutte"],
  ["draft", "Bozza"],
  ["proposed", "Inviate"],
  ["accepted", "Accettate"],
  ["rejected", "Rifiutate"],
  ["expired", "Scadute"],
] as const;

export default async function PartnerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const { offers } = await getBrokerWorkspace();
  const filtered =
    status === "all" ? offers : offers.filter((row) => String(row.status) === status);
  const waiting = offers.filter((row) =>
    ["draft", "proposed", "sent"].includes(String(row.status))
  ).length;

  return (
    <>
      <PartnerPageIntro
        area="offers"
        eyebrow="Proposte"
        title="Offerte"
        description="Offerte emesse sui tuoi lead. Nessuna quota ATLAS esposta qui."
        actions={
          waiting > 0 ? (
            <PartnerBadge tone="warn">{waiting} in attesa</PartnerBadge>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            href={value === "all" ? "/partner/offers" : `/partner/offers?status=${value}`}
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

      <OperationsPanel title={`${filtered.length} offerte`}>
        {!filtered.length ? (
          <PartnerEmptyState
            area="offers"
            title="Nessuna offerta"
            description="Crea la prima offerta dal dettaglio di una richiesta."
            action={{ href: "/partner/leads", label: "Vai alle richieste" }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-2">Cliente / prodotto</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2">Premio</th>
                  <th className="pb-2">Stato</th>
                  <th className="pb-2">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => {
                  const pending = ["draft", "proposed", "sent"].includes(
                    String(row.status)
                  );
                  return (
                    <tr key={String(row.id)}>
                      <td className="py-2.5">
                        <Link
                          href={`/partner/leads/${row.consultation_request_id}`}
                          className="font-semibold text-accent"
                        >
                          {row.clientName ?? "Cliente"} · {row.insurer} · {row.product}
                        </Link>
                      </td>
                      <td>{row.policy_category}</td>
                      <td className="tabular-nums">
                        {row.premium_amount != null ? formatChf(row.premium_amount) : "—"}
                      </td>
                      <td>
                        <PartnerBadge tone={pending ? "warn" : "accent"}>
                          {offerStatusLabel(String(row.status))}
                        </PartnerBadge>
                      </td>
                      <td className="tabular-nums">{formatDate(String(row.created_at))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
