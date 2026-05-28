import Link from "next/link";
import { cn } from "@/lib/utils";
import { atlasPageActions, atlasText } from "@/lib/atlas-ui";

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
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className={atlasText.pageTitle}>{title}</h1>
        {description ? <p className={atlasText.pageDesc}>{description}</p> : null}
      </div>
      {(meta || action) && (
        <div className={cn(atlasPageActions, "shrink-0")}>
          {meta}
          {action}
        </div>
      )}
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
