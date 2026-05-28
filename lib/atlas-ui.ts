/** Shared Tailwind / Atlas utility class strings (theme-safe) */

export const atlasSpace = {
  page: "atlas-stack-page",
  section: "atlas-stack-section",
  block: "atlas-stack-block",
  tight: "atlas-stack-tight",
  micro: "atlas-stack-micro",
  kpiGrid: "atlas-grid-kpi",
  cardGrid: "atlas-grid-cards",
  contentGrid: "atlas-grid-content",
} as const;

export const atlasCard = {
  primary: "atlas-card-primary",
  secondary: "atlas-card-secondary atlas-surface-card",
  support: "atlas-card-support",
  surface: "atlas-surface-card",
  surfaceInteractive: "atlas-surface-card-interactive",
} as const;

export const atlasSurface = {
  card: `${atlasCard.secondary} rounded-xl`,
  cardSm: `${atlasCard.secondary} rounded-lg`,
  muted: "rounded-lg border border-border-subtle bg-card-muted/80",
  inset: "rounded-lg border border-border bg-card-muted/60",
} as const;

export const atlasText = {
  title: "text-foreground",
  body: "text-muted-foreground",
  muted: "text-muted",
  label: "text-[13px] font-medium text-foreground",
  sectionTitle: "text-[13px] font-semibold tracking-tight text-foreground",
  sectionDesc: "text-[11px] leading-snug text-muted",
  pageTitle:
    "text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.625rem]",
  pageDesc: "mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted",
} as const;

/** KPI row: 2 cols mobile → 4 desktop */
export const atlasKpiRow =
  "atlas-grid-kpi grid-cols-2 lg:grid-cols-4" as const;

/** KPI row with 6 cols on xl (analysis) */
export const atlasKpiRowWide =
  "atlas-grid-kpi grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" as const;

/** Main content + sidebar (dashboard, analysis, policy detail) */
export const atlasMainAside =
  "atlas-grid-content xl:grid-cols-3" as const;

export const atlasMainColumn = "atlas-stack-block min-w-0 max-w-full xl:col-span-2" as const;

export const atlasAsideColumn =
  "atlas-stack-block min-w-0 xl:sticky xl:top-6 xl:self-start" as const;

/** Page header CTA cluster — full-width stacked buttons on mobile */
export const atlasPageActions = "atlas-page-actions" as const;
