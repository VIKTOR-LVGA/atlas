import type { AlertSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconAlert } from "@/components/icons";

const severityStyles: Record<AlertSeverity, { bg: string; icon: string; border: string }> = {
  high: {
    bg: "bg-red-50/80",
    icon: "text-red-600",
    border: "border-red-100",
  },
  medium: {
    bg: "bg-amber-50/80",
    icon: "text-amber-600",
    border: "border-amber-100",
  },
  low: {
    bg: "bg-slate-50",
    icon: "text-slate-500",
    border: "border-slate-200",
  },
  info: {
    bg: "bg-blue-50/80",
    icon: "text-blue-600",
    border: "border-blue-100",
  },
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
  const styles = severityStyles[severity];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        styles.bg,
        styles.border,
        className
      )}
    >
      <IconAlert className={cn("mt-0.5 shrink-0", styles.icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
