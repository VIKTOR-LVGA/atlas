import { PageShell } from "@/components/ui/PageShell";
import {
  Skeleton,
  SkeletonCard,
  SkeletonKpiGrid,
} from "@/components/motion/Skeleton";
import { atlasSpace } from "@/lib/atlas-ui";

export default function RecommendationsLoading() {
  return (
    <PageShell>
      <div className={atlasSpace.section}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <SkeletonKpiGrid count={4} />
        <div className={`${atlasSpace.contentGrid} xl:grid-cols-3`}>
          <div className={`${atlasSpace.block} xl:col-span-2`}>
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
          </div>
          <div className={atlasSpace.block}>
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
