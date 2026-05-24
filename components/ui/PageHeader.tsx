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
        <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.625rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
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
  const cls = cn("atlas-btn-primary", className);
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
    <button type="button" className={cn("atlas-btn-secondary", className)}>
      {icon}
      {children}
    </button>
  );
}
