import { Car } from "lucide-react";
import type { MotorVehicleDisplay } from "@/lib/policy-experience/tabs";
import { formatCHF } from "@/lib/utils";

export function PolicyVehicleCard({ vehicle }: { vehicle: MotorVehicleDisplay }) {
  if (!vehicle.title && !vehicle.plate) return null;

  const rows: Array<{ label: string; value: string }> = [
    ...(vehicle.make ? [{ label: "Marca", value: vehicle.make }] : []),
    ...(vehicle.model ? [{ label: "Modello", value: vehicle.model }] : []),
    ...(vehicle.plate ? [{ label: "Targa", value: vehicle.plate }] : []),
    ...(vehicle.firstRegistration
      ? [{ label: "Prima immatricolazione", value: vehicle.firstRegistration }]
      : []),
    ...(vehicle.fuel ? [{ label: "Carburante", value: vehicle.fuel }] : []),
    ...(vehicle.power ? [{ label: "Potenza", value: vehicle.power }] : []),
    ...(vehicle.engineCc ? [{ label: "Cilindrata", value: vehicle.engineCc }] : []),
    ...(vehicle.usage ? [{ label: "Uso", value: vehicle.usage }] : []),
    ...(vehicle.catalogPrice != null
      ? [{ label: "Prezzo catalogo", value: formatCHF(vehicle.catalogPrice) }]
      : []),
    ...(vehicle.leasingCompany
      ? [{ label: "Leasing", value: vehicle.leasingCompany }]
      : []),
  ];

  // One plate only — never list twice
  const seen = new Set<string>();
  const uniqueRows = rows.filter((row) => {
    const key = `${row.label}:${row.value}`.toLowerCase();
    if (seen.has(key)) return false;
    if (row.label === "Targa" && seen.has(`targa:${row.value}`.toLowerCase())) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="flex items-center justify-center bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_16%,transparent),transparent)] p-6">
          <Car className="h-12 w-12 text-accent" strokeWidth={1.4} aria-hidden />
        </div>
        <div className="px-4 py-4 sm:px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Veicolo
          </h2>
          <p className="mt-1 text-[16px] font-semibold text-foreground">
            {vehicle.title || "Veicolo assicurato"}
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {uniqueRows.map((row) => (
              <div key={row.label}>
                <dt className="text-[11px] text-muted">{row.label}</dt>
                <dd className="text-[13px] font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
