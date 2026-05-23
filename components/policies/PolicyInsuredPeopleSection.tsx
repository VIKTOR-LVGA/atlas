import {
  Building2,
  Heart,
  Plane,
  Scale,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import {
  PolicyUnassignedCoverageAssign,
  type InsuredPersonAssignOption,
  type UnassignedCoverageAssignItem,
} from "@/components/policies/PolicyUnassignedCoverageAssign";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { SectionCard } from "@/components/ui/SectionCard";
import type { HealthPolicyGroupedView } from "@/lib/policy-health-grouping";
import { getCoverageNetPremium } from "@/lib/policy-health-grouping";
import type { PolicyCoverageDetail } from "@/lib/types";
import { formatCHF } from "@/lib/utils";

function CoverageIcon({
  coverage,
  className = "h-3.5 w-3.5",
}: {
  coverage: PolicyCoverageDetail;
  className?: string;
}) {
  const kind = `${coverage.coverage_type ?? ""} ${coverage.category_label ?? ""} ${coverage.name}`
    .toLowerCase();

  if (/(hospital|ospedal|spital|privat)/.test(kind)) {
    return <Building2 className={className} />;
  }
  if (/(travel|viagg|world|mondo)/.test(kind)) {
    return <Plane className={className} />;
  }
  if (/(legal|giurid|advocare|protezione giuridica)/.test(kind)) {
    return <Scale className={className} />;
  }
  if (/(complement|lca|vvg|completa|benefit|dental|dent)/.test(kind)) {
    return <Stethoscope className={className} />;
  }
  if (/(lamal|base|grund|assicurazione di base|kvg)/.test(kind)) {
    return <Heart className={className} />;
  }

  return <Shield className={className} />;
}

function formatCoverageLine(coverage: PolicyCoverageDetail) {
  const label = coverage.category_label ?? coverage.coverage_type ?? coverage.name;
  const modelPart =
    coverage.name !== label && coverage.name.length < 48 ? ` — ${coverage.name}` : "";
  const net = getCoverageNetPremium(coverage);
  const gross = coverage.premium_gross;
  const premium =
    net !== null && net !== undefined
      ? formatCHF(net)
      : "—";
  const discountHint =
    gross !== null &&
    gross !== undefined &&
    net !== null &&
    net !== undefined &&
    Math.abs(gross - net) > 0.01
      ? ` (lordo ${formatCHF(gross)})`
      : "";

  return `${label}${modelPart} — ${premium}${discountHint}`;
}

function PersonCoverageRow({ coverage }: { coverage: PolicyCoverageDetail }) {
  const longNote =
    coverage.notes && coverage.notes.length >= 40 ? coverage.notes : null;

  return (
    <li className="flex gap-2.5 rounded-lg border border-slate-50 bg-slate-50/60 px-3 py-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
        <CoverageIcon coverage={coverage} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-snug text-slate-800">
          {formatCoverageLine(coverage)}
        </p>
        {longNote ? (
          <details className="mt-1">
            <summary className="cursor-pointer text-[10px] font-medium text-blue-600">
              Mostra dettagli
            </summary>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{longNote}</p>
          </details>
        ) : null}
        {coverage.uncertain ||
        (coverage.ownership_confidence !== null &&
          coverage.ownership_confidence !== undefined &&
          coverage.ownership_confidence < 70) ? (
          <span className="mt-1 inline-block">
            <ConfidenceBadge
              confidence={coverage.ownership_confidence ?? coverage.confidence}
              uncertain
            />
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function PolicyInsuredPeopleSection({
  grouped,
}: {
  grouped: HealthPolicyGroupedView;
}) {
  if (grouped.people.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Persone assicurate"
      description="Coperture e premi raggruppati per persona assicurata."
    >
      <div className="space-y-4">
        {grouped.people.map((person, index) => {
          const personTotal =
            person.total_monthly_premium ??
            person.premium_amount ??
            person.computedLineTotal;

          return (
            <article
              key={`${person.insured_number ?? person.name ?? "person"}-${index}`}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-slate-900">
                      {person.name ?? "Persona assicurata"}
                    </h3>
                    {person.insured_number ? (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        N. d&apos;assicurato {person.insured_number}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      {person.model ? <span>Modello {person.model}</span> : null}
                      {person.franchise != null ? (
                        <span>Franchigia {formatCHF(person.franchise)}</span>
                      ) : null}
                      {person.base_premium != null ? (
                        <span>Base {formatCHF(person.base_premium)}</span>
                      ) : null}
                      {person.complementary_premium != null ? (
                        <span>Compl. {formatCHF(person.complementary_premium)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <ConfidenceBadge
                  confidence={person.confidence}
                  uncertain={person.uncertain}
                />
              </div>

              {person.coverages.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {person.coverages.map((coverage, coverageIndex) => (
                    <PersonCoverageRow
                      key={`${coverage.name}-${coverageIndex}`}
                      coverage={coverage}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[11px] text-slate-500">
                  Nessuna copertura assegnata a questa persona.
                </p>
              )}

              {personTotal !== null && personTotal !== undefined ? (
                <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] font-semibold text-slate-900">
                  Totale persona — {formatCHF(personTotal)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {grouped.familyPremium !== null ? (
        <p className="mt-4 rounded-xl bg-blue-50/60 px-3 py-2 text-[12px] font-medium text-blue-900">
          Premio famiglia documento — {formatCHF(grouped.familyPremium)}
        </p>
      ) : null}
    </SectionCard>
  );
}

export function PolicyUnassignedCoveragesSection({
  policyId,
  items,
  people,
}: {
  policyId: string;
  items: UnassignedCoverageAssignItem[];
  people: InsuredPersonAssignOption[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Coperture da verificare"
      description="Assegna ogni copertura alla persona corretta"
      badge={
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          {items.length}
        </span>
      }
    >
      <PolicyUnassignedCoverageAssign
        policyId={policyId}
        items={items}
        people={people}
      />
    </CollapsibleSection>
  );
}

export function PolicyGlobalCoveragesSection({
  coverages,
}: {
  coverages: PolicyCoverageDetail[];
}) {
  if (coverages.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Riepilogo coperture (documento)"
      description="Vista globale secondaria — usa la sezione per persona come riferimento principale"
    >
      <ul className="space-y-2">
        {coverages.map((coverage, index) => (
          <li
            key={`${coverage.name}-${index}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-[12px]"
          >
            <span className="min-w-0 font-medium text-slate-800">
              {coverage.name}
              {coverage.insured_person_name ? (
                <span className="ml-1 font-normal text-slate-500">
                  ({coverage.insured_person_name})
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-slate-600">
              {coverage.premium_amount != null
                ? formatCHF(coverage.premium_amount)
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
