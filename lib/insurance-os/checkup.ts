import "server-only";

import { createHash } from "crypto";
import { detectPossibleOverlaps } from "@/lib/insurance-os/action-center-core";
import type { CoverageMapResult } from "@/lib/insurance-os/coverage-map-types";
import type { CheckupResult } from "@/lib/insurance-os/checkup-types";
import type { PolicyChangeEvent } from "@/lib/insurance-os/policy-diff-types";
import { recordTimelineEvent } from "@/lib/insurance-os/timeline";
import { getPolicyDeadlineDate } from "@/lib/policy-schedule";
import { sumPortfolioPremiums } from "@/lib/premium-totals";
import { getPolicyTypeLabel } from "@/lib/policy-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserDocument, UserPolicy } from "@/lib/types";
import { formatCHF } from "@/lib/utils";

export type { CheckupResult } from "@/lib/insurance-os/checkup-types";

function completenessScore(policies: UserPolicy[], documents: UserDocument[]) {
  if (policies.length === 0) return 0;
  let score = 0;
  let total = 0;
  for (const p of policies) {
    const fields = [
      p.provider,
      p.policyNumber,
      p.premiumAmount,
      p.startDate,
      p.endDate ?? p.renewalDate,
      p.documentId,
      p.deductible,
    ];
    for (const f of fields) {
      total += 1;
      if (f != null && f !== "") score += 1;
    }
  }
  if (documents.length > 0) {
    total += 1;
    score += 1;
  }
  return Math.round((score / Math.max(total, 1)) * 100);
}

export function buildAnnualCheckup(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  coverageMap: CoverageMapResult;
  changes: PolicyChangeEvent[];
  now?: Date;
}): Omit<CheckupResult, "id" | "createdAt"> {
  const now = input.now ?? new Date();
  const premiums = sumPortfolioPremiums(input.policies);
  const clearItems: string[] = [];
  const verifyItems: string[] = [];
  const missingItems: string[] = [];

  for (const cat of input.coverageMap.categories) {
    if (cat.status === "covered") {
      clearItems.push(`${cat.label}: copertura trovata nei documenti`);
    } else if (cat.status === "needs_verification" || cat.status === "partially_known") {
      verifyItems.push(`${cat.label}: ${cat.explanation}`);
    } else if (cat.status === "no_policy_found") {
      // Not "you're uncovered"
      missingItems.push(
        `${cat.label}: nessuna polizza caricata che confermi questa area (non implica automaticamente uno scoperto)`
      );
    }
  }

  for (const p of input.policies) {
    if (p.premiumAmount == null) {
      missingItems.push(
        `Premio mancante per ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}`
      );
    }
    if (p.requiresReview) {
      verifyItems.push(
        `Estrazione da confermare: ${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}`
      );
    }
  }

  const overlaps = detectPossibleOverlaps(input.policies).map((o) => o.description);
  const recentChanges = input.changes.slice(0, 8).map((c) => c.displaySummary);

  const upcomingDeadlines: string[] = [];
  for (const p of input.policies) {
    const d = getPolicyDeadlineDate(p);
    if (!d) continue;
    const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntil = Math.round((d.timestamp - startOfToday) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 120) {
      upcomingDeadlines.push(
        `${getPolicyTypeLabel(p.policyType, p.policyCategoryLabel)}: ${d.date} (tra ${daysUntil} g)`
      );
    }
  }

  const usefulQuestions = [
    "Le franchigie corrispondono a ciò che ti aspetti?",
    "Hai caricato le condizioni generali più recenti?",
    "Ci sono persone o beni assicurati non ancora collegati?",
    "Vuoi una seconda verifica umana sul portafoglio?",
  ];

  return {
    policiesAnalyzed: input.policies.length,
    annualCostKnown: premiums.annual,
    categoriesCovered: input.coverageMap.summary.coveredCount,
    dataCompletenessPercent: completenessScore(input.policies, input.documents),
    clearItems,
    verifyItems,
    missingItems: missingItems.slice(0, 20),
    overlaps,
    recentChanges,
    upcomingDeadlines,
    usefulQuestions,
  };
}

/** Idempotent per calendar day: same day returns existing checkup. */
export async function runAnnualCheckup(input: {
  policies: UserPolicy[];
  documents: UserDocument[];
  coverageMap: CoverageMapResult;
  changes: PolicyChangeEvent[];
}): Promise<CheckupResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Accedi di nuovo per continuare.");
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  const portfolioHash = createHash("sha256")
    .update(input.coverageMap.sourceHash)
    .digest("hex")
    .slice(0, 16);
  const idempotencyKey = `checkup:${dayKey}:${portfolioHash}`;

  const { data: existing } = await supabase
    .from("annual_checkups")
    .select("*")
    .eq("user_id", user.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return mapCheckup(existing as Record<string, unknown>);
  }

  const built = buildAnnualCheckup(input);
  const { data, error } = await supabase
    .from("annual_checkups")
    .insert({
      user_id: user.id,
      status: "completed",
      summary: {
        policiesAnalyzed: built.policiesAnalyzed,
        annualCostKnown: built.annualCostKnown,
        categoriesCovered: built.categoriesCovered,
        annualCostLabel:
          built.annualCostKnown != null ? formatCHF(built.annualCostKnown) : null,
      },
      clear_items: built.clearItems,
      verify_items: built.verifyItems,
      missing_items: built.missingItems,
      overlaps_items: built.overlaps,
      recent_changes: built.recentChanges,
      upcoming_deadlines: built.upcomingDeadlines,
      useful_questions: built.usefulQuestions,
      data_completeness_percent: built.dataCompletenessPercent,
      policies_analyzed: built.policiesAnalyzed,
      annual_cost_known: built.annualCostKnown,
      idempotency_key: idempotencyKey,
    })
    .select("*")
    .single();

  if (error) {
    // Concurrent insert
    const { data: again } = await supabase
      .from("annual_checkups")
      .select("*")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (again) return mapCheckup(again as Record<string, unknown>);
    throw new Error(error.message);
  }

  await recordTimelineEvent({
    eventType: "annual_checkup",
    title: "Check-up annuale completato",
    description: `Completezza dati: ${built.dataCompletenessPercent}%`,
    entityType: "checkup",
    entityId: data.id,
    idempotencyKey: `timeline:${idempotencyKey}`,
  });

  return mapCheckup(data as Record<string, unknown>);
}

function mapCheckup(row: Record<string, unknown>): CheckupResult {
  return {
    id: String(row.id),
    policiesAnalyzed: Number(row.policies_analyzed ?? 0),
    annualCostKnown:
      row.annual_cost_known == null ? null : Number(row.annual_cost_known),
    categoriesCovered: Number(
      (row.summary as { categoriesCovered?: number } | null)?.categoriesCovered ?? 0
    ),
    dataCompletenessPercent: Number(row.data_completeness_percent ?? 0),
    clearItems: (row.clear_items as string[]) ?? [],
    verifyItems: (row.verify_items as string[]) ?? [],
    missingItems: (row.missing_items as string[]) ?? [],
    overlaps: (row.overlaps_items as string[]) ?? (row.overlaps as string[]) ?? [],
    recentChanges: (row.recent_changes as string[]) ?? [],
    upcomingDeadlines: (row.upcoming_deadlines as string[]) ?? [],
    usefulQuestions: (row.useful_questions as string[]) ?? [],
    createdAt: String(row.created_at),
  };
}

export async function getLatestCheckup(): Promise<CheckupResult | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("annual_checkups")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapCheckup(data as Record<string, unknown>) : null;
}
