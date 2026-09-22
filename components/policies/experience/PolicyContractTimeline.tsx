import type { UserPolicy } from "@/lib/types";
import { formatScheduleDateFull } from "@/lib/policy-schedule";

export function PolicyContractTimeline({ policy }: { policy: UserPolicy }) {
  const steps = [
    policy.startDate
      ? { id: "start", label: "Inizio", value: formatScheduleDateFull(policy.startDate) }
      : null,
    policy.renewalDate
      ? {
          id: "renewal",
          label: "Scadenza principale",
          value: formatScheduleDateFull(policy.renewalDate),
        }
      : policy.startDate
        ? {
            id: "renewal-hint",
            label: "Scadenza principale",
            value: "Allineata all'anniversario di contratto (se prevista)",
          }
        : null,
    policy.endDate
      ? { id: "end", label: "Fine contratto", value: formatScheduleDateFull(policy.endDate) }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; value: string }>;

  if (steps.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Timeline
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.id} className="relative rounded-xl border border-border-subtle px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[12px] text-muted">{step.label}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-foreground">{step.value}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
