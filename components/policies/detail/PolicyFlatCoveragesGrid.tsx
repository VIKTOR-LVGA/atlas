import { PolicyCoverageCard } from "@/components/policies/PolicyCoverageCard";
import { SectionCard } from "@/components/ui/SectionCard";
import type { PolicyCoverageDetail } from "@/lib/types";

export function PolicyFlatCoveragesGrid({
  coverages,
  title = "Coperture estratte",
}: {
  coverages: PolicyCoverageDetail[];
  title?: string;
}) {
  if (coverages.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title={title}
      description="Vista per riga di copertura dal documento"
      bodyClassName="p-3.5 sm:p-4"
      padding="none"
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {coverages.map((coverage, index) => (
          <PolicyCoverageCard key={`${coverage.name}-${index}`} coverage={coverage} />
        ))}
      </div>
    </SectionCard>
  );
}
