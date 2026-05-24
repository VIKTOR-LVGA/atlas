import { cn } from "@/lib/utils";
import { atlasSpace } from "@/lib/atlas-ui";
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
    <div className={cn(className)}>
      {backHref && backLabel ? (
        <div className="mb-6">
          <BackLink href={backHref} label={backLabel} />
        </div>
      ) : null}
      <div className={atlasSpace.page}>{children}</div>
    </div>
  );
}
