import { PageShell } from "@/components/ui/PageShell";
import {
  Skeleton,
  SkeletonCard,
  SkeletonKpiGrid,
} from "@/components/motion/Skeleton";
import { atlasSpace } from "@/lib/atlas-ui";

export default function MarketLoading() {
  return (
    <PageShell>
      <div className={atlasSpace.section}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <SkeletonKpiGrid count={3} />
        <SkeletonCard lines={5} />
      </div>
    </PageShell>
  );
}
