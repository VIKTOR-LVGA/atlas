import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatChf,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import { offerStatusLabel } from "@/lib/operations-labels";

export const metadata = { title: "Offerte | Partner" };

export default async function PartnerOffersPage() {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const { data, error } = await supabase
    .from("insurance_offers")
    .select(
      "id, consultation_request_id, insurer, product, policy_category, premium_amount, status, created_at"
    )
    .eq("broker_id", broker.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Offerte non disponibili.");

  return (
    <>
      <OperationsHeader
        eyebrow="Proposte"
        title="Offerte"
        description="Offerte emesse sui tuoi lead. Nessuna quota ATLAS esposta qui."
      />
      <OperationsPanel title={`${data?.length ?? 0} offerte`}>
        {!data?.length ? (
          <p className="text-[12px] text-muted">Nessuna offerta ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[12px]">
              <thead className="text-[10px] uppercase text-muted">
                <tr>
                  <th className="pb-2">Prodotto</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2">Premio</th>
                  <th className="pb-2">Stato</th>
                  <th className="pb-2">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2">
                      <Link
                        href={`/partner/leads/${row.consultation_request_id}`}
                        className="font-semibold text-accent"
                      >
                        {row.insurer} · {row.product}
                      </Link>
                    </td>
                    <td>{row.policy_category}</td>
                    <td>{row.premium_amount != null ? formatChf(row.premium_amount) : "—"}</td>
                    <td>{offerStatusLabel(row.status)}</td>
                    <td>{formatDate(row.created_at)}</td>
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
