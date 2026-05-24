import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/PageHeader";
import type { PortfolioProgression } from "@/lib/portfolio-progression";

type PremiumOnboardingEmptyProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  progression?: Pick<
    PortfolioProgression,
    "nextStep" | "milestones" | "headline" | "subheadline"
  >;
  steps?: Array<{ step: string; title: string; text: string }>;
  className?: string;
};

export function PremiumOnboardingEmpty({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  progression,
  steps,
  className,
}: PremiumOnboardingEmptyProps) {
  const defaultSteps = [
    {
      step: "1",
      title: "Carica",
      text: "Archivia PDF assicurativi nel workspace privato.",
    },
    {
      step: "2",
      title: "Estrai",
      text: "OCR e strutturazione automatica dei campi.",
    },
    {
      step: "3",
      title: "Conferma",
      text: "Verifica le bozze AI per sbloccare l'intelligence.",
    },
  ];

  const stepItems = steps ?? defaultSteps;
  const next = progression?.nextStep;

  return (
    <div
      className={cn(
        "atlas-card-primary overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="relative">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 text-accent shadow-sm ring-1 ring-accent/20">
            {icon}
          </span>
          <span
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent/80 ring-2 ring-card"
            aria-hidden
          />
        </div>
        {progression ? (
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            {progression.headline}
          </p>
        ) : null}
        <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-foreground sm:text-[18px]">
          {title}
        </h3>
        <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
          {description}
        </p>
        {progression?.subheadline ? (
          <p className="mt-2 max-w-md text-[12px] text-muted-foreground">
            {progression.subheadline}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <PrimaryButton href={next?.ctaHref ?? actionHref}>
            {next?.ctaLabel ?? actionLabel}
          </PrimaryButton>
          {secondaryActionLabel && secondaryActionHref ? (
            <Link
              href={secondaryActionHref}
              className="atlas-btn-secondary px-4 py-2 text-[12px]"
            >
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border-subtle bg-card-muted/30 px-5 py-5 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {stepItems.map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-border-subtle bg-card/80 p-3 text-left"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                {item.step}. {item.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
