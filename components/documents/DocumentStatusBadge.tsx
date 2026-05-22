import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/ui/StatusBadge";

const statusVariant: Record<string, StatusBadgeVariant> = {
  analyzed: "completed",
  processing: "processing",
  failed: "error",
  uploaded: "neutral",
  completed: "completed",
  analyzing: "processing",
  error: "error",
};

const statusLabel: Record<string, string> = {
  analyzed: "Analizzato",
  processing: "In analisi",
  failed: "Analisi fallita",
  uploaded: "Caricato",
  completed: "Completato",
  analyzing: "In elaborazione",
  error: "Errore",
};

export function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      variant={statusVariant[status] ?? "neutral"}
      label={statusLabel[status] ?? status}
      className={
        status === "processing" || status === "analyzing"
          ? "animate-pulse"
          : undefined
      }
    />
  );
}
