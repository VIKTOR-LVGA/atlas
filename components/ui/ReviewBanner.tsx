import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

interface ReviewBannerProps {
  title: string;
  description: string;
  editHref: string;
  uncertainCount?: number;
  className?: string;
}

export function ReviewBanner({
  title,
  description,
  editHref,
  uncertainCount = 0,
  className,
}: ReviewBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-r from-accent-soft to-card p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-accent shadow-sm">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="attention" label="Da rivedere" />
            {uncertainCount > 0 ? (
              <span className="text-[11px] text-accent">
                {uncertainCount} campi incerti
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[14px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
      <Link
        href={editHref}
        className="atlas-btn-primary inline-flex shrink-0 items-center justify-center px-4 py-2.5 text-[13px] shadow-sm"
      >
        Rivedi bozza
      </Link>
    </div>
  );
}
