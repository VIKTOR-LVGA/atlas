import { PrimaryButton } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

interface PlaceholderModuleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  statusLabel?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function PlaceholderModule({
  icon,
  title,
  description,
  statusLabel = "In arrivo",
  actionLabel = "Vai ai documenti",
  actionHref = "/documents",
  className,
}: PlaceholderModuleProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card-muted px-6 py-10 text-center",
        className
      )}
    >
      <span className="mb-3">
        <StatusBadge variant="processing" label={statusLabel} />
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-accent shadow-sm ring-1 ring-border">
        {icon}
      </span>
      <h2 className="mt-4 text-[16px] font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <PrimaryButton href={actionHref} className="mt-5">
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </div>
  );
}
