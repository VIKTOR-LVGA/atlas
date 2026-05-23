import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/PageHeader";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card-muted px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-accent shadow-sm ring-1 ring-border">
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">
        {description}
      </p>
      {(actionLabel && actionHref) || (secondaryActionLabel && secondaryActionHref) ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actionLabel && actionHref ? (
            <PrimaryButton href={actionHref}>{actionLabel}</PrimaryButton>
          ) : null}
          {secondaryActionLabel && secondaryActionHref ? (
            <Link
              href={secondaryActionHref}
              className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground shadow-sm hover:bg-card-muted"
            >
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
