import {
  Building2,
  Calendar,
  ClipboardCheck,
  FileText,
  Layers3,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import type { MarketOverviewSignal } from "@/lib/market-intelligence";
import { atlasKpiRowWide } from "@/lib/atlas-ui";

const iconById: Record<string, ReactNode> = {
  readiness: <Sparkles className="h-4 w-4" />,
  eligible: <Shield className="h-4 w-4" />,
  providers: <Building2 className="h-4 w-4" />,
  categories: <Layers3 className="h-4 w-4" />,
  premiums: <Wallet className="h-4 w-4" />,
  renewals: <Calendar className="h-4 w-4" />,
  coverages: <Layers3 className="h-4 w-4" />,
  confirmed: <ClipboardCheck className="h-4 w-4" />,
  pdfs: <FileText className="h-4 w-4" />,
  confidence: <Sparkles className="h-4 w-4" />,
};

const variantById: Record<string, "blue" | "green" | "yellow" | "purple" | "indigo" | "red"> = {
  readiness: "purple",
  eligible: "indigo",
  providers: "blue",
  categories: "green",
  premiums: "yellow",
  renewals: "blue",
  coverages: "green",
  confirmed: "indigo",
  pdfs: "blue",
  confidence: "purple",
};

type MarketIntelligenceOverviewProps = {
  signals: MarketOverviewSignal[];
};

export function MarketIntelligenceOverview({ signals }: MarketIntelligenceOverviewProps) {
  const primary = signals.filter((signal) =>
    ["readiness", "eligible", "providers", "categories", "premiums", "renewals"].includes(
      signal.id
    )
  );

  return (
    <div className={atlasKpiRowWide}>
      {primary.map((signal) => (
        <MetricCard
          key={signal.id}
          label={signal.label}
          value={signal.available ? signal.value : "—"}
          subtext={signal.subtext}
          variant={variantById[signal.id] ?? "indigo"}
          unavailableValue={!signal.available}
          icon={iconById[signal.id]}
        />
      ))}
    </div>
  );
}
