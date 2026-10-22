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
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        <h1 className="text-[21px] font-bold tracking-[-0.035em] text-foreground sm:text-[24px]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
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
