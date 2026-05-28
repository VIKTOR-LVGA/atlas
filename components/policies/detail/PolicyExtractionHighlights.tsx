import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Layers3,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ExtractionHighlight } from "@/lib/policy-extraction-reveal";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";

const iconById: Record<string, ReactNode> = {
  provider: <Building2 className="h-4 w-4" />,
  people: <Users className="h-4 w-4" />,
  coverages: <Layers3 className="h-4 w-4" />,
  premium: <Wallet className="h-4 w-4" />,
  deductible: <Shield className="h-4 w-4" />,
  renewal: <Calendar className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  review: <AlertTriangle className="h-4 w-4" />,
};

type PolicyExtractionHighlightsProps = {
  highlights: ExtractionHighlight[];
};

export function PolicyExtractionHighlights({
  highlights,
}: PolicyExtractionHighlightsProps) {
  if (highlights.length === 0) {
    return (
      <SectionCard tone="support" padding="sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Atlas ha bisogno di verifica manuale
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Alcuni dati non sono stati rilevati automaticamente. Apri la revisione
              per completare la scheda.
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Atlas ha identificato"
      description="Elementi estratti dal PDF"
      tone="primary"
      padding="sm"
      bodyClassName="space-y-3"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {highlights.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex min-w-0 items-start gap-2.5 rounded-xl border px-3 py-2.5",
              item.tone === "success" &&
                "border-emerald-500/20 bg-emerald-500/[0.05] dark:border-emerald-900/35 dark:bg-emerald-950/15",
              item.tone === "warning" &&
                "atlas-alert-warning",
              item.tone === "neutral" && "border-border-subtle bg-card-muted/40"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                item.tone === "success" &&
                  "bg-[var(--success-bg)] text-[var(--success-text)]",
                item.tone === "warning" &&
                  "bg-[var(--warning-bg)] text-[var(--warning-text)]",
                item.tone === "neutral" && "bg-accent-soft text-accent"
              )}
            >
              {iconById[item.id] ?? <Sparkles className="h-4 w-4" />}
            </span>
            <span className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground">{item.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{item.detail}</p>
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
