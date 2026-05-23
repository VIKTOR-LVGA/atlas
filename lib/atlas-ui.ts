/** Shared Tailwind class strings for theme-safe surfaces */
export const atlasSurface = {
  card: "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
  cardSm: "rounded-xl border border-border bg-card shadow-[var(--shadow-card)]",
  muted: "rounded-xl border border-border-subtle bg-card-muted",
  inset: "rounded-lg border border-border bg-card-muted",
} as const;

export const atlasText = {
  title: "text-foreground",
  body: "text-muted-foreground",
  muted: "text-muted",
  label: "text-[13px] font-medium text-foreground",
} as const;
