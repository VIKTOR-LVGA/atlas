import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import type { PolicyFieldConfidenceRow } from "@/lib/policy-types";

export function PolicyFieldConfidenceTable({
  rows,
}: {
  rows: PolicyFieldConfidenceRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-slate-50 bg-slate-50/80 text-[10px] uppercase tracking-wide text-slate-400">
            <th className="px-3 py-2 font-medium">Campo</th>
            <th className="px-3 py-2 font-medium">Valore</th>
            <th className="px-3 py-2 text-right font-medium">Confidenza</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-slate-50 last:border-0">
              <td className="px-3 py-2.5 font-medium text-slate-800">{row.label}</td>
              <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-600">
                {row.value || "—"}
              </td>
              <td className="px-3 py-2.5 text-right">
                <ConfidenceBadge
                  confidence={row.confidence}
                  uncertain={row.uncertain}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
