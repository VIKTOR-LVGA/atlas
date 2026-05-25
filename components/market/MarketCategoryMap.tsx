import { CheckCircle2, CircleDashed } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { MarketCategorySlot } from "@/lib/market-intelligence";
import { cn } from "@/lib/utils";

type MarketCategoryMapProps = {
  categories: MarketCategorySlot[];
  missingCount: number;
};

export function MarketCategoryMap({ categories, missingCount }: MarketCategoryMapProps) {
  const detected = categories.filter((slot) => slot.detected);

  return (
    <SectionCard
      title="Mappa categorie portafoglio"
      description="Solo categorie rilevate da polizze reali — nessuna inferenza di mercato"
      bodyClassName="space-y-3"
    >
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 font-medium text-[var(--success-text)]">
          {detected.length} rilevate
        </span>
        <span className="rounded-full border border-border-subtle bg-card-muted px-2.5 py-1 font-medium text-muted">
          {missingCount} non presenti
        </span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((slot) => (
          <li
            key={slot.type}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              slot.detected
                ? slot.comparisonReady
                  ? "border-emerald-500/20 bg-emerald-500/[0.05] dark:border-emerald-900/30"
                  : "border-accent/20 bg-accent-soft/30"
                : "border-dashed border-border bg-card-muted/30 opacity-80"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-foreground">{slot.label}</p>
              {slot.detected ? (
                <CheckCircle2
                  className={cn(
                    "h-4 w-4 shrink-0",
                    slot.comparisonReady
                      ? "text-[var(--success-text)]"
                      : "text-accent"
                  )}
                />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0 text-muted" />
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted">
              {slot.detected
                ? `${slot.policyCount} polizza${slot.policyCount === 1 ? "" : "e"}`
                : "Non rilevata"}
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
              {slot.readinessDetail}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
