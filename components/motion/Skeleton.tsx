import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("atlas-skeleton", className)} aria-hidden />;
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="atlas-surface-card p-3">
          <div className="flex gap-2.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="atlas-surface-card space-y-3 p-4">
      <Skeleton className="h-3 w-28" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-2.5 w-full" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="atlas-surface-card overflow-hidden p-3">
      <Skeleton className="mb-3 h-3 w-32" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
