import { PageShell } from "@/components/ui/PageShell";
import { atlasKpiRow, atlasSpace } from "@/lib/atlas-ui";
import {
  Skeleton,
  SkeletonCard,
  SkeletonKpiGrid,
  SkeletonTable,
} from "@/components/motion/Skeleton";

function LoadingHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-3 w-72 max-w-full" />
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className={atlasKpiRow}>
        <SkeletonKpiGrid count={4} />
      </div>
      <div className={`${atlasSpace.contentGrid} xl:grid-cols-3`}>
        <div className={`${atlasSpace.block} xl:col-span-2`}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
        <div className={atlasSpace.block}>
          <SkeletonCard lines={5} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </PageShell>
  );
}

export function PoliciesLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <SkeletonKpiGrid count={4} />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <SkeletonTable rows={6} />
    </PageShell>
  );
}

export function DocumentsLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <SkeletonKpiGrid count={4} />
      <div className={`${atlasSpace.contentGrid} lg:grid-cols-3`}>
        <SkeletonTable rows={8} />
        <SkeletonCard lines={6} />
      </div>
    </PageShell>
  );
}

export function AnalysisLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <Skeleton className="h-28 w-full rounded-xl" />
      <SkeletonKpiGrid count={6} />
      <div className={`${atlasSpace.cardGrid} md:grid-cols-2`}>
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </PageShell>
  );
}
