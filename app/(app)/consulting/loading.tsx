import { PageShell } from "@/components/ui/PageShell";
import {
  Skeleton,
  SkeletonCard,
  SkeletonKpiGrid,
} from "@/components/motion/Skeleton";
import { atlasMainAside, atlasSpace } from "@/lib/atlas-ui";

export default function ConsultingLoading() {
  return (
    <PageShell>
      <div className={atlasSpace.section}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <SkeletonKpiGrid count={4} />
        <div className={atlasMainAside}>
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    </PageShell>
  );
}
