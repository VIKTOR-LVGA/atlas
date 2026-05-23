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
    <div
      className={cn(
        "rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-amber-900">{title}</p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-amber-800">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
