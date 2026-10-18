import { getPolicyTypeLabel } from "@/lib/policy-types";
import type { UserPolicy } from "@/lib/types";

export type PolicyDeadline = {
  policyId: string;
  label: string;
  date: string;
  kind: "cancellation" | "renewal" | "end";
  daysUntil: number;
};

function parsePolicyDate(value: string) {
  const timestamp = new Date(`${value}T12:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getPolicyDeadlineCandidates(policy: UserPolicy) {
  const cancellationValue = policy.details.cancellation_deadline;
  const cancellation = cancellationValue
    ? parsePolicyDate(cancellationValue)
    : null;
  const renewal = policy.renewalDate ? parsePolicyDate(policy.renewalDate) : null;
  const end = policy.endDate ? parsePolicyDate(policy.endDate) : null;
  return [
    cancellation !== null && cancellationValue
      ? { date: cancellationValue, kind: "cancellation" as const, timestamp: cancellation }
      : null,
    renewal !== null && policy.renewalDate
      ? { date: policy.renewalDate, kind: "renewal" as const, timestamp: renewal }
      : null,
    end !== null && policy.endDate
      ? { date: policy.endDate, kind: "end" as const, timestamp: end }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
}

export function getPolicyDeadlineDate(policy: UserPolicy, now?: Date) {
  const startOfToday = now
    ? Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    : null;
  const candidates = getPolicyDeadlineCandidates(policy).filter(
    (candidate) => startOfToday === null || candidate.timestamp >= startOfToday
  );

  return candidates.sort((a, b) => a.timestamp - b.timestamp)[0] ?? null;
}

export function getUpcomingDeadlines(
  policies: UserPolicy[],
  now = new Date(),
  limit = 5
): PolicyDeadline[] {
  const startOfToday = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return policies
    .flatMap((policy) =>
      getPolicyDeadlineCandidates(policy).map((deadline) => {
      const daysUntil = Math.round(
        (deadline.timestamp - startOfToday) / (1000 * 60 * 60 * 24)
      );

      return {
        policyId: policy.id,
        label: `${getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel)} · ${
          deadline.kind === "cancellation"
            ? "termine di disdetta"
            : deadline.kind === "renewal"
              ? "rinnovo"
              : "scadenza"
        }`,
        date: deadline.date,
        kind: deadline.kind,
        daysUntil,
      } satisfies PolicyDeadline;
      })
    )
    .filter((item): item is PolicyDeadline => item !== null && item.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function formatScheduleDate(date: string) {
  const timestamp = new Date(`${date}T12:00:00`).getTime();
  if (!Number.isFinite(timestamp)) {
    return "Data da completare";
  }

  return new Intl.DateTimeFormat("it-CH", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Zurich",
  }).format(new Date(timestamp));
}

export function formatScheduleDateFull(date: string) {
  const timestamp = new Date(`${date}T12:00:00`).getTime();
  if (!Number.isFinite(timestamp)) {
    return "Data da completare";
  }

  return new Intl.DateTimeFormat("it-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Zurich",
  }).format(new Date(timestamp));
}

export function greetingForZurich(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Zurich",
    }).format(now)
  );

  if (hour < 12) {
    return "Buongiorno";
  }

  if (hour < 18) {
    return "Buon pomeriggio";
  }

  return "Buonasera";
}
