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
    padding === "none" ? "" : padding === "sm" ? "p-4" : "p-5";

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11px] text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn(paddingClass, bodyClassName)}>{children}</div>
    </section>
  );
}
