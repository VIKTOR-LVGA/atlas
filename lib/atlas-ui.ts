/** Shared Tailwind class strings for theme-safe surfaces */
export const atlasSurface = {
  card: "atlas-surface-card rounded-xl",
  cardSm: "atlas-surface-card rounded-lg",
  muted: "rounded-lg border border-border-subtle bg-card-muted/80",
  inset: "rounded-lg border border-border bg-card-muted/60",
} as const;

export const atlasText = {
  title: "text-foreground",
  body: "text-muted-foreground",
  muted: "text-muted",
  label: "text-[13px] font-medium text-foreground",
} as const;
