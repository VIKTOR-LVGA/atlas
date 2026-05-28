import { Lock } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { SettingsLockedModule } from "@/lib/settings-display";

type SettingsLockedModulesGridProps = {
  modules: SettingsLockedModule[];
  title?: string;
  description?: string;
};

export function SettingsLockedModulesGrid({
  modules,
  title = "Funzioni avanzate — in preparazione",
  description = "Ogni modulo si attiverà quando sarà disponibile per il tuo account",
}: SettingsLockedModulesGridProps) {
  return (
    <SectionCard title={title} description={description} bodyClassName="space-y-3">
      <ul className="grid gap-2 sm:grid-cols-2">
        {modules.map((module) => (
          <li
            key={module.id}
            className="flex flex-col rounded-xl border border-dashed border-border bg-card-muted/30 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/20 text-muted">
                <Lock className="h-4 w-4" aria-hidden />
              </span>
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                In preparazione
              </span>
            </div>
            <p className="mt-2 text-[12px] font-semibold text-foreground">{module.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{module.description}</p>
            <p className="mt-2 border-t border-border-subtle pt-2 text-[10px] text-muted-foreground">
              {module.futureDetail}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
