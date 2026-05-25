import { CheckCircle2, Clock3, HardDrive, Save } from "lucide-react";
import { settingsCapabilities } from "@/lib/settings-display";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: {
    icon: CheckCircle2,
    label: "Attivo",
    className: "text-[var(--success-text)]",
  },
  saved: {
    icon: Save,
    label: "Salvato",
    className: "text-accent",
  },
  preparing: {
    icon: Clock3,
    label: "In preparazione",
    className: "text-muted",
  },
  local: {
    icon: HardDrive,
    label: "Locale",
    className: "text-muted-foreground",
  },
} as const;

export function SettingsCapabilitiesStrip() {
  return (
    <div className="atlas-card-secondary rounded-xl p-3.5 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Cosa funziona oggi
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {settingsCapabilities.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <li
              key={item.id}
              className="rounded-lg border border-border-subtle bg-card-muted/40 px-2.5 py-2"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", config.className)} />
                {item.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted">{item.detail}</p>
              <p className={cn("mt-1 text-[9px] font-medium", config.className)}>
                {config.label}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
