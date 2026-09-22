import type { UserPolicy } from "@/lib/types";
import { getMotorVehicleDisplay } from "@/lib/policy-experience/tabs";
import { getPolicyCoverages } from "@/lib/policy-types";

/** Max 3–6 contract-specific conditions — no legal boilerplate. */
export function PolicyImportantConditions({ policy }: { policy: UserPolicy }) {
  const items: string[] = [];
  const vehicle = getMotorVehicleDisplay(policy.details as Record<string, unknown>);
  const coverages = getPolicyCoverages(policy.details);

  if (vehicle.leasingCompany) {
    items.push(`Leasing: ${vehicle.leasingCompany}`);
  }

  const parking = coverages.find((c) =>
    /parcheggio|parking/i.test(`${c.name} ${c.canonical_type ?? ""}`)
  );
  if (parking?.notes && /sinistr|claim|max/i.test(parking.notes)) {
    items.push(parking.notes);
  } else if (parking && /plus/i.test(parking.name ?? "")) {
    items.push("Danni di parcheggio: verifica limite sinistri/anno nella polizza.");
  }

  const notes = policy.extractionNotes;
  if (notes && /help point|officine partner|garage/i.test(notes)) {
    items.push("Riparazione presso officine partner (se indicata nella polizza).");
  }

  const details = policy.details as Record<string, unknown>;
  if (typeof details.casco === "string" && details.casco.trim()) {
    items.push(`Casco: ${details.casco}`);
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Condizioni importanti
      </h2>
      <ul className="mt-2 space-y-2">
        {items.slice(0, 6).map((item) => (
          <li key={item} className="text-[13px] leading-relaxed text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
