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
      className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[23px] sm:h-32 sm:w-36"
    >
      <div className="absolute inset-0 bg-accent-soft" />
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
    <section className="atlas-consumer-hero overflow-hidden rounded-[26px] border border-border shadow-[var(--shadow-card)]">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div className="min-w-0">
          <p className="atlas-premium-eyebrow">
            {(policy.provider || "Assicuratore").toUpperCase()} · {category.label}
          </p>
          <h1 className="atlas-premium-title mt-2">
            {headline}
          </h1>
          {subline ? (
            <p className="mt-1 text-[13px] text-muted">{subline}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
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
