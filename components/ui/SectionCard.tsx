import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padding?: "none" | "sm" | "md";
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padding = "md",
}: SectionCardProps) {
  const paddingClass =
    padding === "none" ? "" : padding === "sm" ? "p-3.5" : "p-4";

  return (
    <section
      className={cn(
        "atlas-surface-card overflow-hidden",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{description}</p>
            )}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn(paddingClass, bodyClassName)}>{children}</div>
    </section>
  );
}
