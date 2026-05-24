import { cn } from "@/lib/utils";
import { BackLink } from "@/components/ui/BackLink";

interface PageShellProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageShell({
  children,
  backHref,
  backLabel,
  className,
}: PageShellProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {backHref && backLabel ? (
        <BackLink href={backHref} label={backLabel} />
      ) : null}
      {children}
    </div>
  );
}
