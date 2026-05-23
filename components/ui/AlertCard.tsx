import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconAlert } from "@/components/icons";

const severityStyles: Record<AlertSeverity, string> = {
  high: "atlas-alert-danger",
  medium: "atlas-alert-warning",
  low: "atlas-surface-muted",
  info: "atlas-alert-info",
};

interface AlertCardProps {
  title: string;
  description: string;
  severity: AlertSeverity;
  action?: React.ReactNode;
  className?: string;
}

export function AlertCard({
  title,
  description,
  severity,
  action,
  className,
}: AlertCardProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        severityStyles[severity],
        className
      )}
    >
      <IconAlert className="mt-0.5 shrink-0 opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm leading-relaxed opacity-90">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
