import { getPolicyTypeLabel } from "@/lib/policy-types";
import type { UserPolicy } from "@/lib/types";

export type PolicyDeadline = {
  policyId: string;
  label: string;
  date: string;
  kind: "renewal" | "end";
  daysUntil: number;
};

function parsePolicyDate(value: string) {
  const timestamp = new Date(`${value}T12:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getPolicyDeadlineDate(policy: UserPolicy) {
  const renewal = policy.renewalDate ? parsePolicyDate(policy.renewalDate) : null;
  const end = policy.endDate ? parsePolicyDate(policy.endDate) : null;

  if (renewal !== null && end !== null) {
    return renewal <= end
      ? { date: policy.renewalDate as string, kind: "renewal" as const, timestamp: renewal }
      : { date: policy.endDate as string, kind: "end" as const, timestamp: end };
  }

  if (renewal !== null && policy.renewalDate) {
    return { date: policy.renewalDate, kind: "renewal" as const, timestamp: renewal };
  }

  if (end !== null && policy.endDate) {
    return { date: policy.endDate, kind: "end" as const, timestamp: end };
  }

  return null;
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
    .map((policy) => {
      const deadline = getPolicyDeadlineDate(policy);
      if (!deadline) {
        return null;
      }

      const daysUntil = Math.round(
        (deadline.timestamp - startOfToday) / (1000 * 60 * 60 * 24)
      );

      return {
        policyId: policy.id,
        label: getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel),
        date: deadline.date,
        kind: deadline.kind,
        daysUntil,
      } satisfies PolicyDeadline;
    })
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
