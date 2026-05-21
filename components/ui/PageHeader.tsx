import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        {meta}
        {action}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  href,
  icon,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700",
    className
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls}>
      {icon}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
