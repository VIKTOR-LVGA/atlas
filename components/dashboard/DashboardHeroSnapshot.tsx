import type { DashboardHeroSnapshot as HeroModel } from "@/lib/dashboard-view";

type DashboardHeroSnapshotProps = {
  hero: HeroModel;
};

export function DashboardHeroSnapshot({ hero }: DashboardHeroSnapshotProps) {
  return (
    <section className="atlas-card-primary overflow-hidden">
      <div className="border-b border-border-subtle bg-gradient-to-r from-accent-soft/40 via-card to-card px-5 py-5 sm:px-6">
        <p className="atlas-section-eyebrow text-accent">Oggi</p>
        <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground sm:text-[22px]">
          {hero.greeting}
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] font-medium leading-snug text-foreground">
          {hero.headline}
        </p>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted">
          {hero.reason}
        </p>
        {hero.todayLine ? (
          <p className="mt-2 text-[11px] font-medium text-accent">{hero.todayLine}</p>
        ) : null}
      </div>
    </section>
  );
}
