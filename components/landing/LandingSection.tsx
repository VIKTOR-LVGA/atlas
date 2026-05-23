import type { ReactNode } from "react";

type Tone = "base" | "lift" | "deep" | "glow";

const toneClass: Record<Tone, string> = {
  base: "landing-section-tone-base",
  lift: "landing-section-tone-lift",
  deep: "landing-section-tone-deep",
  glow: "landing-section-tone-glow",
};

export function LandingSection({
  id,
  tone = "base",
  className = "",
  children,
  grid = false,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  grid?: boolean;
}) {
  return (
    <section
      id={id}
      className={`landing-section relative ${toneClass[tone]} ${className}`}
    >
      {grid ? <div className="landing-grid-bg pointer-events-none absolute inset-0 opacity-[0.35]" /> : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl";

  return (
    <div className={alignClass}>
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 className="landing-heading mt-3">{title}</h2>
      {description ? (
        <p className="landing-lead mt-4">{description}</p>
      ) : null}
    </div>
  );
}
