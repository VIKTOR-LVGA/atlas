import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "ok"
  | "attention"
  | "critical"
  | "active"
  | "expiring"
  | "review"
  | "completed"
  | "processing"
  | "error"
  | "high"
  | "medium"
  | "low"
  | "neutral";

const styles: Record<StatusBadgeVariant, string> = {
  ok: "bg-[var(--success-bg)] text-[var(--success-text)]",
  attention: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  critical: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  active: "bg-[var(--success-bg)] text-[var(--success-text)]",
  expiring: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  review: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  completed: "bg-[var(--success-bg)] text-[var(--success-text)]",
  processing: "bg-accent-soft text-accent",
  error: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  high: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  medium: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  low: "bg-card-muted text-muted",
  neutral: "bg-card-muted text-muted",
};

const labels: Record<StatusBadgeVariant, string> = {
  ok: "Ok",
  attention: "Attenzione",
  critical: "Critico",
  active: "Attiva",
  expiring: "In scadenza",
  review: "Da rivedere",
  completed: "Completato",
  processing: "In elaborazione",
  error: "Errore OCR",
  high: "Alta priorità",
  medium: "Attenzione",
  low: "Bassa",
  neutral: "",
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        styles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
