import { AlertCircle, Layers3, Link2, Sparkles } from "lucide-react";
import { AnimatedProgressBar } from "@/components/motion/AnimatedProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PolicyCoverageIntelligenceSummary } from "@/lib/policy-detail-display";
import { getCoverageTierLabel } from "@/lib/policy-detail-display";

interface PolicyCoverageIntelligenceProps {
  summary: PolicyCoverageIntelligenceSummary;
}

export function PolicyCoverageIntelligence({
  summary,
}: PolicyCoverageIntelligenceProps) {
  if (summary.totalCoverages === 0) {
    return (
      <SectionCard
        title="Intelligence coperture"
        description="Segmentazione e completezza"
      >
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Layers3 className="h-7 w-7 text-muted" />
          <p className="text-[13px] font-medium text-foreground">Coperture non disponibili</p>
          <p className="max-w-sm text-[12px] text-muted">
            Nessuna riga di copertura estratta per questa polizza. Rivedi il documento o
            modifica manualmente.
          </p>
        </div>
      </SectionCard>
    );
  }

  const maxSegment = Math.max(...summary.segments.map((segment) => segment.count), 1);

  return (
    <SectionCard
      title="Intelligence coperture"
      description="Completezza, assegnazioni e segmentazione per categoria"
      bodyClassName="space-y-3 p-3.5 sm:p-4"
      padding="none"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <IntelStat
          icon={<Layers3 className="h-4 w-4" />}
          label="Totale righe"
          value={String(summary.totalCoverages)}
        />
        <IntelStat
          icon={<Link2 className="h-4 w-4" />}
          label="Assegnate"
          value={String(summary.assignedToPeople)}
          tone={summary.unassigned > 0 ? "warning" : "success"}
        />
        <IntelStat
          icon={<AlertCircle className="h-4 w-4" />}
          label="Da verificare"
          value={String(summary.uncertain + summary.unassigned)}
          tone={summary.uncertain + summary.unassigned > 0 ? "warning" : "neutral"}
        />
        <IntelStat
          icon={<Sparkles className="h-4 w-4" />}
          label="Completezza"
          value={
            summary.completenessPercent !== null
              ? `${summary.completenessPercent}%`
              : "N/D"
          }
        />
      </div>

      {summary.completenessPercent !== null ? (
        <div className="atlas-surface-card rounded-lg p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Completezza assegnazioni
            </p>
            <span className="text-[12px] font-semibold tabular-nums text-foreground">
              {summary.completenessPercent}%
            </span>
          </div>
          <AnimatedProgressBar percent={summary.completenessPercent} />
        </div>
      ) : null}

      {summary.segments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Segmentazione
          </p>
          {summary.segments.map((segment) => (
            <div key={segment.tier} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-medium text-foreground">{segment.label}</span>
                <span className="tabular-nums text-muted">{segment.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-card-muted">
                <div
                  className="atlas-bar-grow h-full rounded-full bg-accent/70"
                  style={{
                    width: `${Math.round((segment.count / maxSegment) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {summary.unassigned > 0 ? (
          <StatusBadge variant="attention" label={`${summary.unassigned} non assegnate`} />
        ) : (
          <StatusBadge variant="ok" label="Tutte assegnate" />
        )}
        {summary.uncertain > 0 ? (
          <StatusBadge variant="attention" label={`${summary.uncertain} incerte`} />
        ) : null}
        {summary.lowOwnership > 0 ? (
          <StatusBadge
            variant="neutral"
            label={`${summary.lowOwnership} ownership debole`}
          />
        ) : null}
        {summary.segments.map((segment) => (
          <span
            key={segment.tier}
            className="rounded-full border border-border bg-card-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {getCoverageTierLabel(segment.tier)} · {segment.count}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}

function IntelStat({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <div className="atlas-kpi-card flex items-center gap-2.5 rounded-lg border border-border-subtle bg-card p-2.5">
      <span
        className={
          tone === "warning"
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--warning-bg)] text-[var(--warning-text)]"
            : tone === "success"
              ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--success-bg)] text-[var(--success-text)]"
              : "atlas-icon-well flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
        }
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted">{label}</p>
        <p className="text-[14px] font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
