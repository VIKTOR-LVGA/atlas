import { ClipboardList } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { ConsultingExpertTopic } from "@/lib/consulting-intelligence";
import { cn } from "@/lib/utils";

type ConsultingExpertOverviewProps = {
  topics: ConsultingExpertTopic[];
};

export function ConsultingExpertOverview({ topics }: ConsultingExpertOverviewProps) {
  return (
    <SectionCard
      title="Cosa potrà controllare un esperto"
      description="Quando il servizio sarà disponibile — nessuna revisione umana è già stata effettuata"
      bodyClassName="space-y-3"
    >
      <div className="rounded-lg border border-dashed border-border bg-card-muted/40 px-3 py-2.5">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          Prepara il dossier con Atlas: i controlli sotto usano solo lo stato reale del
          tuo portafoglio.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              topic.available
                ? "border-border-subtle bg-card-muted/40"
                : "border-dashed border-border bg-card-muted/20 opacity-80"
            )}
          >
            <p className="text-[12px] font-semibold text-foreground">{topic.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">{topic.description}</p>
            <p
              className={cn(
                "mt-1.5 text-[13px] font-semibold tabular-nums",
                topic.available ? "text-foreground" : "text-muted"
              )}
            >
              {topic.available ? topic.value : "—"}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
