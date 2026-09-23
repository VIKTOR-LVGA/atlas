import { VERIFICATION_LABELS, type VerificationStatus } from "@/lib/insurance-os/verification";
import { cn } from "@/lib/utils";

const toneStyles: Record<VerificationStatus, string> = {
  confirmed: "atlas-alert-success",
  inferred: "atlas-alert-info",
  needs_verification: "atlas-alert-warning",
  missing: "atlas-surface-muted text-muted",
};

export function VerificationBadge({
  status,
  detailed = false,
  className,
}: {
  status: VerificationStatus;
  /** Use the long explanation as accessible title. */
  detailed?: boolean;
  className?: string;
}) {
  const label = VERIFICATION_LABELS[status];

  return (
    <span
      title={detailed ? label.long : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        toneStyles[status],
        className
      )}
    >
      <span aria-hidden="true" className="font-semibold leading-none">
        {label.symbol}
      </span>
      {label.short}
    </span>
  );
}

export function VerificationLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {(Object.keys(VERIFICATION_LABELS) as VerificationStatus[]).map((status) => (
        <li key={status}>
          <VerificationBadge status={status} detailed />
        </li>
      ))}
    </ul>
  );
}
