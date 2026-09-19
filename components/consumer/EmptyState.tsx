import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <div className="atlas-consumer-card px-5 py-10 text-center sm:px-8">
      <p className="text-[17px] font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link href={actionHref} className="atlas-btn-primary min-h-11 w-full max-w-xs px-5 text-[13px] sm:w-auto">
            {actionLabel}
          </Link>
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="atlas-btn-secondary min-h-11 w-full max-w-xs px-5 text-[13px] sm:w-auto"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="atlas-consumer-card min-w-0 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 truncate text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function ConsumerSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
