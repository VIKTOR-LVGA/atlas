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
  ok: "bg-emerald-50 text-emerald-700",
  attention: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-amber-50 text-amber-700",
  review: "bg-red-50 text-red-700",
  completed: "bg-emerald-50 text-emerald-700",
  processing: "bg-blue-50 text-blue-700",
  error: "bg-red-50 text-red-700",
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
  neutral: "bg-slate-100 text-slate-600",
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
