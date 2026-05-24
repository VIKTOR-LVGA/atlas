import { cn } from "@/lib/utils";
import { atlasCard, atlasText } from "@/lib/atlas-ui";

type SectionCardTone = "primary" | "secondary" | "support";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padding?: "none" | "sm" | "md";
  tone?: SectionCardTone;
}

const toneClasses: Record<SectionCardTone, string> = {
  primary: atlasCard.primary,
  secondary: atlasCard.secondary,
  support: atlasCard.support,
};

const headerPadding: Record<SectionCardTone, string> = {
  primary: "px-4 py-3 sm:px-5",
  secondary: "px-4 py-2.5",
  support: "px-4 py-2.5",
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padding = "md",
  tone = "secondary",
}: SectionCardProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "p-3.5 sm:p-4"
        : tone === "primary"
          ? "p-4 sm:p-5"
          : "p-4";

  return (
    <section className={cn(toneClasses[tone], "overflow-hidden", className)}>
      {(title || action) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-border-subtle",
            headerPadding[tone]
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className={atlasText.sectionTitle}>{title}</h2> : null}
            {description ? (
              <p className={cn("mt-1", atlasText.sectionDesc)}>{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn(paddingClass, bodyClassName)}>{children}</div>
    </section>
  );
}
