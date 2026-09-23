import Link from "next/link";
import { ActionCenter } from "@/components/insurance-os/ActionCenter";
import { ClaimList } from "@/components/insurance-os/ClaimList";
import { TimelineList } from "@/components/insurance-os/TimelineList";
import { listAttentionItems } from "@/lib/insurance-os/action-center";
import { listCurrentUserClaims } from "@/lib/insurance-os/claims";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { listCurrentUserTimelineEvents } from "@/lib/insurance-os/timeline";
import { cn } from "@/lib/utils";

export const metadata = { title: "Attività" };

const TABS = [
  { id: "actions", label: "Da fare" },
  { id: "timeline", label: "Storia" },
  { id: "claims", label: "Sinistri" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(raw: string | undefined): TabId {
  return TABS.some((tab) => tab.id === raw) ? (raw as TabId) : "actions";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);
  const claimsEnabled = isIosFeatureEnabled("claims");

  const [attentionItems, timelineEvents, claims] = await Promise.all([
    listAttentionItems(),
    listCurrentUserTimelineEvents({ limit: 60 }),
    claimsEnabled ? listCurrentUserClaims() : Promise.resolve([]),
  ]);

  const counts: Record<TabId, number> = {
    actions: attentionItems.length,
    timeline: timelineEvents.length,
    claims: claims.length,
  };

  const visibleTabs = TABS.filter((item) => item.id !== "claims" || claimsEnabled);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
          Attività
        </h1>
        <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Quello che richiede attenzione, quello che è successo e le pratiche in corso.
        </p>
      </header>

      <nav aria-label="Sezioni attività" className="flex gap-1 overflow-x-auto">
        {visibleTabs.map((item) => {
          const active = item.id === tab;
          return (
            <Link
              key={item.id}
              href={`/activity?tab=${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition duration-200",
                active
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "text-muted hover:bg-card-muted hover:text-foreground"
              )}
            >
              {item.label}
              {counts[item.id] > 0 ? (
                <span className="text-[11px] text-muted">{counts[item.id]}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === "actions" ? (
        <ActionCenter
          items={attentionItems}
          emptyMessage="Nessun elemento aperto. ATLAS continua a controllare scadenze, premi e documenti."
        />
      ) : null}

      {tab === "timeline" ? <TimelineList events={timelineEvents} /> : null}

      {tab === "claims" && claimsEnabled ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-prose text-[13px] leading-relaxed text-muted">
              ATLAS prepara il dossier e la checklist. L’invio alla compagnia resta una tua
              scelta.
            </p>
            <Link href="/claims/new" className="atlas-btn-primary min-h-11 px-4 text-[13px]">
              Nuovo dossier
            </Link>
          </div>
          <ClaimList claims={claims} />
        </div>
      ) : null}
    </div>
  );
}
