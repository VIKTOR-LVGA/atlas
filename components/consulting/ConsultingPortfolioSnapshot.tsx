import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileText,
  Shield,
  Target,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import type { ConsultingPortfolioSnapshot as SnapshotData } from "@/lib/consulting-intelligence";
import { atlasKpiRow } from "@/lib/atlas-ui";

type ConsultingPortfolioSnapshotProps = {
  snapshot: SnapshotData;
};

export function ConsultingPortfolioSnapshot({ snapshot }: ConsultingPortfolioSnapshotProps) {
  return (
    <div className="space-y-4">
      <div className={atlasKpiRow}>
        <MetricCard
          label="Polizze confermate"
          value={String(snapshot.confirmedPolicies)}
          subtext={`${snapshot.pendingReviewPolicies} in revisione`}
          variant="green"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <MetricCard
          label="PDF analizzati"
          value={
            snapshot.documentsTotal > 0
              ? `${snapshot.documentsAnalyzed}/${snapshot.documentsTotal}`
              : "—"
          }
          subtext="Documenti pronti per dossier"
          variant="blue"
          unavailableValue={snapshot.documentsTotal === 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <MetricCard
          label="PDF collegati"
          value={
            snapshot.confirmedPolicies > 0
              ? `${snapshot.linkedPdfCount}/${snapshot.confirmedPolicies}`
              : "—"
          }
          subtext="Tracciabilità sorgente"
          variant="indigo"
          unavailableValue={snapshot.confirmedPolicies === 0}
          icon={<Shield className="h-4 w-4" />}
        />
        <MetricCard
          label="Azioni prioritarie"
          value={String(snapshot.highPriorityRecommendations)}
          subtext={`${snapshot.totalRecommendations} raccomandazioni totali`}
          variant={
            snapshot.highPriorityRecommendations > 0 ? "yellow" : "green"
          }
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <SectionCard title="Snapshot dossier" padding="sm" tone="support">
        <ul className="space-y-2 text-[12px]">
          <li className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2">
            <span className="text-muted">Campi critici mancanti</span>
            <span className="font-semibold tabular-nums text-foreground">
              {snapshot.missingCriticalFields > 0
                ? snapshot.missingCriticalFields
                : "Nessuno"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2">
            <span className="text-muted">Coperture da assegnare</span>
            <span className="font-semibold tabular-nums text-foreground">
              {snapshot.unassignedCoverages}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2">
            <span className="inline-flex items-center gap-1 text-muted">
              <BarChart3 className="h-3.5 w-3.5" />
              Market readiness
            </span>
            <span className="font-semibold text-foreground">
              {snapshot.marketReadinessLabel ?? "—"}
              {snapshot.marketReadinessPercent !== null
                ? ` · ${snapshot.marketReadinessPercent}%`
                : ""}
            </span>
          </li>
          {snapshot.averageExtractionConfidence !== null ? (
            <li className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-card-muted/40 px-3 py-2">
              <span className="text-muted">Confidenza estrazione</span>
              <span className="font-semibold tabular-nums text-foreground">
                {snapshot.averageExtractionConfidence}%
              </span>
            </li>
          ) : null}
        </ul>
        {snapshot.highPriorityRecommendations > 0 ? (
          <Link
            href="/recommendations"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Vedi raccomandazioni prioritarie
          </Link>
        ) : null}
      </SectionCard>
    </div>
  );
}
