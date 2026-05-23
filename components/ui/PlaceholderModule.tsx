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
        "flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center",
        className
      )}
    >
      <span className="mb-3">
        <StatusBadge variant="processing" label={statusLabel} />
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-100">
        {icon}
      </span>
      <h2 className="mt-4 text-[16px] font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate-500">
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
