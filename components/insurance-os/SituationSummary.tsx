import { MetricTile } from "@/components/consumer/EmptyState";
import { formatScheduleDate } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";

export type SituationSummaryInput = {
  annualCost: number | null;
  monthlyCost: number | null;
  activePolicies: number;
  totalPolicies: number;
  coveredAreas: number | null;
  needsVerificationCount: number;
  overlapCount: number;
  nextDeadline: { date: string; label: string; daysUntil: number } | null;
};

/**
 * Only renders a tile when the value can actually be derived from the portfolio.
 * A missing number is never replaced by an invented one.
 */
export function SituationSummary({ data }: { data: SituationSummaryInput }) {
  const tiles: Array<{ label: string; value: string; hint?: string }> = [];

  if (data.annualCost !== null) {
    tiles.push({
      label: "Costo annuo noto",
      value: formatCHF(data.annualCost),
      hint:
        data.monthlyCost !== null
          ? `circa ${formatCHF(data.monthlyCost)} al mese`
          : "dalle polizze con premio indicato",
    });
  }

  if (data.totalPolicies > 0) {
    tiles.push({
      label: "Polizze attive",
      value: String(data.activePolicies),
      hint: `${data.totalPolicies} nel portafoglio`,
    });
  }

  if (data.coveredAreas !== null) {
    tiles.push({
      label: "Aree con copertura",
      value: String(data.coveredAreas),
      hint: "confermate dai documenti",
    });
  }

  if (data.needsVerificationCount > 0) {
    tiles.push({
      label: "Da verificare",
      value: String(data.needsVerificationCount),
      hint: "aree con dubbi nelle condizioni",
    });
  }

  if (data.overlapCount > 0) {
    tiles.push({
      label: "Possibili sovrapposizioni",
      value: String(data.overlapCount),
      hint: "da confrontare, non una conclusione",
    });
  }

  if (data.nextDeadline) {
    tiles.push({
      label: "Prossima scadenza",
      value: formatScheduleDate(data.nextDeadline.date),
      hint:
        data.nextDeadline.daysUntil === 0
          ? `${data.nextDeadline.label} · oggi`
          : `${data.nextDeadline.label} · tra ${data.nextDeadline.daysUntil} g`,
    });
  }

  if (tiles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <MetricTile key={tile.label} label={tile.label} value={tile.value} hint={tile.hint} />
      ))}
    </div>
  );
}
