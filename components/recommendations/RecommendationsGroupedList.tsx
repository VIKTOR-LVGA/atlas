import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { SectionCard } from "@/components/ui/SectionCard";
import type { RecommendationGroup } from "@/lib/recommendations-intelligence";
import { atlasSpace } from "@/lib/atlas-ui";

interface RecommendationsGroupedListProps {
  groups: RecommendationGroup[];
}

export function RecommendationsGroupedList({
  groups,
}: RecommendationsGroupedListProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={atlasSpace.block}>
      {groups.map((group) => (
        <SectionCard
          key={group.category}
          title={group.label}
          description={`${group.items.length} azione${group.items.length === 1 ? "" : "i"} sul portafoglio`}
          padding="sm"
          bodyClassName={atlasSpace.tight}
        >
          {group.items.map((item) => (
            <RecommendationCard key={item.id} recommendation={item} />
          ))}
        </SectionCard>
      ))}
    </div>
  );
}
