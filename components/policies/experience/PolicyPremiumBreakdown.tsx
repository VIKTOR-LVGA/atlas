import type { UserPolicy } from "@/lib/types";
import { getPolicyCoverages } from "@/lib/policy-types";
import { formatCHF } from "@/lib/utils";

/**
 * Premium breakdown from extracted coverage premiums when available.
 * Never invents reconciliation — shows note when totals may differ.
 */
export function PolicyPremiumBreakdown({ policy }: { policy: UserPolicy }) {
  const coverages = getPolicyCoverages(policy.details);
  const lines = coverages
    .map((coverage) => {
      const amount =
        typeof coverage.premium_final === "number"
          ? coverage.premium_final
          : typeof coverage.premium_amount === "number"
            ? coverage.premium_amount
            : null;
      if (amount === null || amount === 0) return null;
      return { label: coverage.name ?? "Voce", amount };
    })
    .filter(Boolean) as Array<{ label: string; amount: number }>;

  const annual =
    typeof policy.details?.annual_gross_premium === "number"
      ? policy.details.annual_gross_premium
      : null;

  if (lines.length === 0 && annual === null) return null;

  const sumLines = lines.reduce((sum, line) => sum + line.amount, 0);
  const mismatch =
    annual !== null && lines.length > 0 && Math.abs(sumLines - annual) > 5;

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Composizione premio
      </h2>
      {annual !== null ? (
        <p className="mt-2 text-[18px] font-semibold text-foreground">
          {formatCHF(annual)}
          <span className="ml-1 text-[12px] font-normal text-muted">/ anno</span>
        </p>
      ) : null}
      {lines.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {lines.slice(0, 12).map((line) => (
            <li
              key={`${line.label}-${line.amount}`}
              className="flex items-center justify-between gap-3 text-[13px]"
            >
              <span className="min-w-0 truncate text-muted">{line.label}</span>
              <span className="font-medium text-foreground">{formatCHF(line.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        {mismatch
          ? "Il totale può includere sconti, tasse o voci non elencate sopra."
          : "Il totale include eventuali sconti e tasse quando riportati nel PDF."}
      </p>
    </section>
  );
}
