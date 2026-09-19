import { PageShell } from "@/components/ui/PageShell";
import { atlasKpiRow, atlasSpace } from "@/lib/atlas-ui";
import {
  Skeleton,
  SkeletonCard,
  SkeletonKpiGrid,
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
      <div className={atlasKpiRow}>
        <SkeletonKpiGrid count={4} />
      </div>
      <Skeleton className="h-40 w-full rounded-[1.25rem]" />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </PageShell>
  );
}

export function PoliciesLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <Skeleton className="h-28 w-full rounded-[1.25rem]" />
      <Skeleton className="h-28 w-full rounded-[1.25rem]" />
    </PageShell>
  );
}

export function DocumentsLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <Skeleton className="h-40 w-full rounded-[1.25rem]" />
      <Skeleton className="h-16 w-full rounded-[1.25rem]" />
      <Skeleton className="h-16 w-full rounded-[1.25rem]" />
    </PageShell>
  );
}

export function OpportunitiesLoadingSkeleton() {
  return (
    <PageShell>
      <LoadingHeader />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
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
