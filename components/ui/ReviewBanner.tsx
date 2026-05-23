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
        "flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-white p-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="attention" label="Da rivedere" />
            {uncertainCount > 0 ? (
              <span className="text-[11px] text-indigo-700">
                {uncertainCount} campi incerti
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[14px] font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
      <Link
        href={editHref}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Rivedi bozza
      </Link>
    </div>
  );
}
