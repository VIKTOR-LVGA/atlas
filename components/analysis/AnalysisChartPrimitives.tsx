import { cn } from "@/lib/utils";
import type { AnalysisDistributionSegment } from "@/lib/analysis-intelligence";

const toneColors: Record<
  AnalysisDistributionSegment["tone"],
  { stroke: string; fill: string; bar: string }
> = {
  blue: {
    stroke: "stroke-blue-500",
    fill: "fill-blue-500/15",
    bar: "bg-blue-500/80",
  },
  green: {
    stroke: "stroke-emerald-500",
    fill: "fill-emerald-500/15",
    bar: "bg-emerald-500/80",
  },
  yellow: {
    stroke: "stroke-amber-500",
    fill: "fill-amber-500/15",
    bar: "bg-amber-500/80",
  },
  purple: {
    stroke: "stroke-violet-500",
    fill: "fill-violet-500/15",
    bar: "bg-violet-500/80",
  },
  red: {
    stroke: "stroke-red-500",
    fill: "fill-red-500/15",
    bar: "bg-red-500/80",
  },
  indigo: {
    stroke: "stroke-indigo-500",
    fill: "fill-indigo-500/15",
    bar: "bg-indigo-500/80",
  },
  neutral: {
    stroke: "stroke-slate-400",
    fill: "fill-slate-400/15",
    bar: "bg-slate-400/80",
  },
};

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

interface AnalysisDonutChartProps {
  segments: AnalysisDistributionSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  className?: string;
}

export function AnalysisDonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 120,
  className,
}: AnalysisDonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-dashed border-border bg-card-muted/40 text-[11px] text-muted",
          className
        )}
        style={{ width: size, height: size }}
      >
        N/D
      </div>
    );
  }

  const arcs = segments.reduce<
    Array<{ segment: AnalysisDistributionSegment; startAngle: number; endAngle: number }>
  >((accumulated, segment) => {
    const startAngle =
      accumulated.length === 0
        ? 0
        : accumulated[accumulated.length - 1].endAngle;
    const endAngle = startAngle + (segment.value / total) * 360;

    return [...accumulated, { segment, startAngle, endAngle }];
  }, []);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          className="fill-none stroke-border/60"
          strokeWidth={10}
        />
        {arcs.map(({ segment, startAngle, endAngle }) => {
          const colors = toneColors[segment.tone];

          return (
            <path
              key={segment.id}
              d={describeArc(cx, cy, radius, startAngle, endAngle)}
              className={cn("fill-none", colors.stroke)}
              strokeWidth={10}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue ? (
            <span className="text-[15px] font-semibold tabular-nums text-foreground">
              {centerValue}
            </span>
          ) : null}
          {centerLabel ? (
            <span className="text-[9px] text-muted-foreground">{centerLabel}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface AnalysisSegmentLegendProps {
  segments: AnalysisDistributionSegment[];
  valueFormatter?: (value: number, segment: AnalysisDistributionSegment) => string;
}

export function AnalysisSegmentLegend({
  segments,
  valueFormatter = (value) => String(value),
}: AnalysisSegmentLegendProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <ul className="min-w-0 flex-1 space-y-1.5">
      {segments.map((segment) => {
        const colors = toneColors[segment.tone];
        const percent =
          total > 0 ? Math.round((segment.value / total) * 100) : 0;

        return (
          <li key={segment.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", colors.bar)} />
              <span className="truncate text-[11px] text-foreground">{segment.label}</span>
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {valueFormatter(segment.value, segment)}{" "}
              {total > 0 ? `(${percent}%)` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface AnalysisHorizontalBarsProps {
  segments: AnalysisDistributionSegment[];
  formatValue?: (value: number) => string;
}

export function AnalysisHorizontalBars({
  segments,
  formatValue = (value) => String(value),
}: AnalysisHorizontalBarsProps) {
  const max = Math.max(...segments.map((segment) => segment.value), 1);

  if (segments.length === 0) {
    return (
      <p className="py-6 text-center text-[11px] text-muted-foreground">
        Servono più polizze confermate.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {segments.map((segment) => {
        const colors = toneColors[segment.tone];
        const width = Math.max(4, Math.round((segment.value / max) * 100));

        return (
          <li key={segment.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-foreground">{segment.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                {formatValue(segment.value)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-card-muted">
              <div
                className={cn("h-full rounded-full transition-all", colors.bar)}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface AnalysisCompletenessBarsProps {
  items: { label: string; value: number; total: number }[];
}

export function AnalysisCompletenessBars({ items }: AnalysisCompletenessBarsProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const percent =
          item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;

        return (
          <li key={item.label}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-foreground">{item.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.total === 0 ? "N/D" : `${item.value}/${item.total} (${percent}%)`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-card-muted">
              <div
                className="h-full rounded-full bg-accent/70"
                style={{ width: item.total > 0 ? `${percent}%` : "0%" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
