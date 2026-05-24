import Link from "next/link";
import { AlertTriangle, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DashboardAlert,
  DashboardAlertSeverity,
} from "@/lib/dashboard-intelligence";

const severityStyles: Record<
  DashboardAlertSeverity,
  { iconWrap: string; pill: string; icon: string }
> = {
  high: {
    iconWrap: "bg-[var(--danger-bg)] ring-1 ring-[var(--danger-border)]",
    pill: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
    icon: "text-[var(--danger-text)]",
  },
  medium: {
    iconWrap: "bg-[var(--warning-bg)] ring-1 ring-[var(--warning-border)]",
    pill: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
    icon: "text-[var(--warning-text)]",
  },
  low: {
    iconWrap: "bg-card-muted ring-1 ring-border",
    pill: "bg-card-muted text-muted-foreground",
    icon: "text-muted",
  },
};

const severityLabels: Record<DashboardAlertSeverity, string> = {
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

interface DashboardAlertListProps {
  alerts: DashboardAlert[];
  maxItems?: number;
}

export function DashboardAlertList({
  alerts,
  maxItems = 8,
}: DashboardAlertListProps) {
  const visibleAlerts = alerts.slice(0, maxItems);

  if (visibleAlerts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card-muted/40 px-3 py-6 text-center">
        <p className="text-[12px] font-medium text-foreground">Nessun alert attivo</p>
        <p className="mt-0.5 text-[11px] text-muted">
          Gli avvisi compaiono solo quando i dati reali lo richiedono.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle">
      {visibleAlerts.map((alert) => {
        const styles = severityStyles[alert.severity];

        return (
          <li key={alert.id}>
            <Link
              href={alert.ctaHref}
              className="group flex items-center gap-2.5 py-2.5 transition-colors hover:bg-card-muted/50"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
                  styles.iconWrap
                )}
              >
                {alert.severity === "low" ? (
                  <Info className={cn("h-3.5 w-3.5", styles.icon)} />
                ) : (
                  <AlertTriangle className={cn("h-3.5 w-3.5", styles.icon)} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] font-medium text-foreground">
                    {alert.title}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                      styles.pill
                    )}
                  >
                    {severityLabels[alert.severity]}
                  </span>
                </span>
                <span className="mt-px block line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {alert.explanation}
                </span>
              </span>
              <span className="hidden shrink-0 items-center gap-0.5 text-[10px] font-medium text-accent sm:flex">
                {alert.ctaLabel}
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
