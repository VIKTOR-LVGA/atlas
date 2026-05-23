import { cn } from "@/lib/utils";

export interface InfoGridItem {
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}

interface InfoGridProps {
  items: InfoGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  compact?: boolean;
}

export function InfoGrid({
  items,
  columns = 2,
  className,
  compact = false,
}: InfoGridProps) {
  const columnClass =
    columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <dl className={cn("grid gap-4", columnClass, className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(item.span === 2 && "sm:col-span-2", compact && "min-w-0")}
        >
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {item.label}
          </dt>
          <dd
            className={cn(
              "mt-1 font-medium text-foreground",
              compact ? "text-[12px]" : "text-[13px]"
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
