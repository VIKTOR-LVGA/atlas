import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningPanelProps {
  title?: string;
  items: string[];
  className?: string;
}

export function WarningPanel({
  title = "Da verificare",
  items,
  className,
}: WarningPanelProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-xl border px-4 py-3 atlas-alert-warning", className)}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold">{title}</p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed opacity-90">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
