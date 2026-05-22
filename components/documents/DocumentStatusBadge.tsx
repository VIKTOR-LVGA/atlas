import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/ui/StatusBadge";

const statusVariant: Record<string, StatusBadgeVariant> = {
  completed: "completed",
  analyzing: "processing",
  uploaded: "processing",
  error: "error",
};

const statusLabel: Record<string, string> = {
  completed: "Completato",
  analyzing: "In elaborazione",
  uploaded: "Caricato",
  error: "Errore",
};

export function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      variant={statusVariant[status] ?? "neutral"}
      label={statusLabel[status] ?? status}
    />
  );
}
