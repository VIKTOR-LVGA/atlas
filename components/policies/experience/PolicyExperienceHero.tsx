import { Car, HeartPulse, Home, Scale, Shield, Plane, Sparkles } from "lucide-react";
import type { UserPolicy } from "@/lib/types";
import { getVisualCategoryForPolicy } from "@/lib/policy-visual-categories";
import { getPolicyStatusLabel } from "@/lib/policy-consumer-display";
import { getPolicyAnnualPremium } from "@/lib/premium-totals";
import { formatScheduleDateFull } from "@/lib/policy-schedule";
import { formatCHF } from "@/lib/utils";
import { getMotorVehicleDisplay } from "@/lib/policy-experience/tabs";

function CategoryVisual({ policyType }: { policyType: string }) {
  const icon =
    policyType === "car" ? (
      <Car className="h-10 w-10" strokeWidth={1.5} />
    ) : policyType === "health" ? (
      <HeartPulse className="h-10 w-10" strokeWidth={1.5} />
    ) : policyType === "household" || policyType === "building" ? (
      <Home className="h-10 w-10" strokeWidth={1.5} />
    ) : policyType === "liability" ? (
      <Shield className="h-10 w-10" strokeWidth={1.5} />
    ) : policyType === "legal" ? (
      <Scale className="h-10 w-10" strokeWidth={1.5} />
    ) : policyType === "travel" ? (
      <Plane className="h-10 w-10" strokeWidth={1.5} />
    ) : (
      <Sparkles className="h-10 w-10" strokeWidth={1.5} />
    );

  return (
    <div
      aria-hidden
      className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl sm:h-36 sm:w-40"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_55%),linear-gradient(160deg,color-mix(in_srgb,var(--accent)_12%,transparent),transparent)]" />
      <div className="relative text-accent">{icon}</div>
    </div>
  );
}

export function PolicyExperienceHero({ policy }: { policy: UserPolicy }) {
  const category = getVisualCategoryForPolicy(policy);
  const status = getPolicyStatusLabel(policy);
  const annual = getPolicyAnnualPremium(policy);
  const detailsAnnual =
    typeof policy.details?.annual_gross_premium === "number"
      ? policy.details.annual_gross_premium
      : null;
  const displayAnnual = detailsAnnual ?? annual;
  const vehicle = getMotorVehicleDisplay(policy.details as Record<string, unknown>);
  const isMotor = policy.policyType === "car";

  const headline = isMotor
    ? vehicle.title || category.label
    : policy.provider?.trim() || category.label;

  const subline = isMotor
    ? policy.provider?.trim() || null
    : policy.policyNumber
      ? `N. ${policy.policyNumber}`
      : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            {(policy.provider || "Assicuratore").toUpperCase()} · {category.label}
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
            {headline}
          </h1>
          {subline ? (
            <p className="mt-1 text-[13px] text-muted">{subline}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {isMotor && vehicle.plate ? (
              <span className="rounded-lg border border-border bg-[color-mix(in_srgb,var(--background)_60%,transparent)] px-2.5 py-1 text-[12px] font-semibold tracking-wide text-foreground">
                {vehicle.plate}
              </span>
            ) : null}
            {displayAnnual != null ? (
              <span className="rounded-lg border border-border bg-[color-mix(in_srgb,var(--background)_60%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-foreground">
                {formatCHF(displayAnnual)} / anno
              </span>
            ) : null}
            {policy.startDate || policy.endDate ? (
              <span className="rounded-lg border border-border px-2.5 py-1 text-[12px] text-muted">
                {[
                  policy.startDate ? formatScheduleDateFull(policy.startDate) : null,
                  policy.endDate ? formatScheduleDateFull(policy.endDate) : null,
                ]
                  .filter(Boolean)
                  .join(" → ")}
              </span>
            ) : null}
            <span className="rounded-lg border border-border px-2.5 py-1 text-[12px] text-muted">
              {status}
            </span>
          </div>
        </div>

        <CategoryVisual policyType={policy.policyType} />
      </div>
    </section>
  );
}
