import { Car, CheckCircle2, CircleDashed } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatCHF } from "@/lib/utils";
import type { PolicyCoverageDetail, UserPolicy } from "@/lib/types";
import { getPolicyCoverages } from "@/lib/policy-types";

function isExcluded(coverage: PolicyCoverageDetail) {
  return coverage.coverage_status === "excluded";
}

function isIncluded(coverage: PolicyCoverageDetail) {
  if (isExcluded(coverage)) return false;
  return (
    coverage.coverage_status === "included" ||
    coverage.coverage_status === "conditional" ||
    coverage.coverage_status == null ||
    coverage.coverage_status === "unknown"
  );
}

export function MotorPolicyExperience({ policy }: { policy: UserPolicy }) {
  const label = `${policy.policyType} ${policy.policyCategoryLabel ?? ""}`.toLowerCase();
  const isMotor =
    policy.policyType === "car" || /car|auto|vehicle|motor|veicol/.test(label);
  if (!isMotor) return null;

  const details = (policy.details ?? {}) as Record<string, unknown>;
  const coverages = getPolicyCoverages(policy.details);
  const included = coverages.filter(isIncluded);
  const excluded = coverages.filter(isExcluded);
  const vehicle = {
    make: details.vehicle_make ? String(details.vehicle_make) : null,
    model: String(
      details.vehicle_model ?? details.vehicle ?? details.insured_object ?? ""
    ).trim() || null,
    plate: String(
      details.license_plate ?? details.plate_number ?? details.plate ?? ""
    ).trim() || null,
  };

  const annual =
    policy.premiumAmount != null
      ? Number(policy.premiumAmount) *
        (policy.premiumFrequency === "monthly"
          ? 12
          : policy.premiumFrequency === "quarterly"
            ? 4
            : policy.premiumFrequency === "semiannual"
              ? 2
              : 1)
      : null;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,transparent),transparent)] px-4 py-5 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {policy.provider || "Assicuratore"} · Auto
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
            {vehicle.make || vehicle.model
              ? [vehicle.make, vehicle.model].filter(Boolean).join(" ")
              : "Veicolo assicurato"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted">
            {vehicle.plate ? (
              <span className="rounded-lg border border-border bg-card px-2.5 py-1 font-semibold text-foreground">
                {vehicle.plate}
              </span>
            ) : null}
            {annual != null ? (
              <span className="rounded-lg border border-border bg-card px-2.5 py-1 font-semibold text-foreground">
                {formatCHF(annual)} / anno
              </span>
            ) : null}
            {policy.startDate || policy.endDate || policy.renewalDate ? (
              <span className="rounded-lg border border-border bg-card px-2.5 py-1">
                {[policy.startDate, policy.endDate || policy.renewalDate]
                  .filter(Boolean)
                  .join(" → ")}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {(vehicle.make || vehicle.model || vehicle.plate) ? (
        <SectionCard title="Veicolo" description="Dati oggetto assicurato dal documento">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Car className="h-5 w-5" />
            </span>
            <dl className="grid flex-1 gap-2 text-[12px] sm:grid-cols-2">
              <div>
                <dt className="text-muted">Marca / modello</dt>
                <dd className="font-medium">
                  {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Targa</dt>
                <dd className="font-medium">{vehicle.plate ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </SectionCard>
      ) : null}

      {(included.length > 0 || excluded.length > 0) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard title="Coperture incluse" description="Selezionate nel contratto">
            <ul className="space-y-2">
              {included.map((coverage, index) => (
                <li
                  key={`in-${coverage.name}-${index}`}
                  className="flex items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-[12px]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{coverage.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {[
                        coverage.coverage_amount != null
                          ? `Somma ${formatCHF(Number(coverage.coverage_amount))}`
                          : null,
                        coverage.deductible != null
                          ? `Franchigia ${formatCHF(Number(coverage.deductible))}`
                          : coverage.franchise != null
                            ? `Franchigia ${formatCHF(Number(coverage.franchise))}`
                            : null,
                        coverage.premium_amount != null
                          ? `Premio ${formatCHF(Number(coverage.premium_amount))}`
                          : coverage.premium_final != null
                            ? `Premio ${formatCHF(Number(coverage.premium_final))}`
                            : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Coperta"}
                    </p>
                  </div>
                </li>
              ))}
              {!included.length ? (
                <p className="text-[12px] text-muted">Nessuna copertura inclusa rilevata.</p>
              ) : null}
            </ul>
          </SectionCard>

          <SectionCard title="Non incluse" description="Esplicitamente assenti o non selezionate">
            <ul className="space-y-2">
              {excluded.map((coverage, index) => (
                <li
                  key={`ex-${coverage.name}-${index}`}
                  className="flex items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-[12px]"
                >
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{coverage.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">Non inclusa nel contratto</p>
                  </div>
                </li>
              ))}
              {!excluded.length ? (
                <p className="text-[12px] text-muted">
                  Nessuna esclusione esplicita rilevata nel documento.
                </p>
              ) : null}
            </ul>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
