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
    padding === "none" ? "" : padding === "sm" ? "p-3 sm:p-4" : "p-4 sm:p-5";

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
          <div>
            {title && (
              <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn(paddingClass, bodyClassName)}>{children}</div>
    </section>
  );
}
