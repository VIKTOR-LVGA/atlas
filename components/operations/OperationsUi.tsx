export function OperationsHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-6"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">{description}</p></header>;
}

export function OperationsMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"><p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>{detail ? <p className="mt-1 text-[11px] text-muted">{detail}</p> : null}</div>;
}

export function OperationsPanel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]"><div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="text-[13px] font-semibold">{title}</h2>{action}</div><div className="p-4">{children}</div></section>;
}

export const operationsInput = "w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px] text-foreground outline-none focus:border-accent";
export const operationsButton = "atlas-btn-primary inline-flex items-center justify-center rounded-lg px-3 py-2 text-[12px] font-medium disabled:opacity-50";

export function formatChf(value: number | string | null | undefined) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("it-CH", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined }).format(new Date(value)) : "—";
}
