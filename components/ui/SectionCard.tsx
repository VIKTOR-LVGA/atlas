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
        "rounded-2xl border border-slate-100 bg-white shadow-sm",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-50 px-5 py-3.5">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn(paddingClass, bodyClassName)}>{children}</div>
    </section>
  );
}
