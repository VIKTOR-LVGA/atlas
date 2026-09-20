import Link from "next/link";
import {
  OperationsHeader,
  OperationsPanel,
  formatDate,
} from "@/components/operations/OperationsUi";
import { requireOperationsRole } from "@/lib/operations-access";
import {
  appointmentChannelLabel,
  appointmentStatusLabel,
} from "@/lib/operations-labels";

export const metadata = { title: "Appuntamenti | Partner" };

export default async function PartnerAppointmentsPage() {
  const { supabase, broker } = await requireOperationsRole(["broker"]);
  if (!broker) throw new Error("Profilo broker mancante.");

  const { data, error } = await supabase
    .from("consultation_appointments")
    .select(
      "id, consultation_request_id, scheduled_at, duration_minutes, channel, status, location_or_link, notes"
    )
    .eq("broker_id", broker.id)
    .order("scheduled_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Appuntamenti non disponibili.");

  return (
    <>
      <OperationsHeader
        eyebrow="Agenda"
        title="Appuntamenti"
        description="Solo gli appuntamenti legati ai tuoi mandati assegnati."
      />
      <OperationsPanel title={`${data?.length ?? 0} appuntamenti`}>
        {!data?.length ? (
          <p className="text-[12px] text-muted">Nessun appuntamento programmato.</p>
        ) : (
          <div className="space-y-2">
            {data.map((row) => (
              <Link
                key={row.id}
                href={`/partner/leads/${row.consultation_request_id}`}
                className="block rounded-lg border border-border p-3 text-[12px] hover:border-accent"
              >
                <p className="font-semibold">
                  {formatDate(row.scheduled_at)}
                  <span className="float-right text-accent">
                    {appointmentStatusLabel(row.status)}
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {appointmentChannelLabel(row.channel)} · {row.duration_minutes} min
                </p>
              </Link>
            ))}
          </div>
        )}
      </OperationsPanel>
    </>
  );
}
