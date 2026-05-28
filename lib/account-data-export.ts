import "server-only";

import { cache } from "react";
import {
  getConsultingIntelligence,
  type ConsultingPortfolioSnapshot,
} from "@/lib/consulting-intelligence";
import { getCurrentUserDocuments } from "@/lib/documents";
import { getMarketIntelligence } from "@/lib/market-intelligence";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getCurrentProfile } from "@/lib/profiles";
import { getRecommendationsIntelligence } from "@/lib/recommendations-intelligence";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrentProfile,
  UserDocument,
  UserPolicy,
} from "@/lib/types";

export const ATLAS_DATA_EXPORT_VERSION = "1.0";

export type AtlasDataExportBundle = {
  exportVersion: string;
  generatedAt: string;
  accountId: string;
  profile: ExportedProfile | null;
  documents: ExportedDocument[];
  policies: UserPolicy[];
  extractionCorrections: ExportedExtractionCorrection[];
  intelligence: {
    recommendations: ExportedRecommendationsSummary;
    market: ExportedMarketSummary;
    consulting: ExportedConsultingSummary;
  };
  meta: {
    documentCount: number;
    policyCount: number;
    correctionCount: number;
    includesRawPdfFiles: false;
    includesServiceSecrets: false;
  };
};

export type ExportedProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  language: CurrentProfile["language"];
  currency: CurrentProfile["currency"];
  dateFormat: CurrentProfile["dateFormat"];
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  hasProfileRow: boolean;
};

export type ExportedDocument = {
  id: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  status: UserDocument["status"];
  createdAt: string;
  updatedAt: string;
};

export type ExportedExtractionCorrection = {
  id: string;
  policyId: string | null;
  documentId: string | null;
  correctionType: string | null;
  correctionKind: string | null;
  correctionSource: string | null;
  fieldName: string | null;
  fieldPath: string | null;
  provider: string | null;
  policyType: string | null;
  coverageName: string | null;
  coverageKind: string | null;
  coverageStableKey: string | null;
  aiValueBefore: unknown;
  correctedValueAfter: unknown;
  confidenceBefore: number | null;
  previousAssignment: Record<string, unknown> | null;
  correctedAssignment: Record<string, unknown>;
  reviewedAt: string | null;
  createdAt: string;
};

export type ExportedRecommendationsSummary = {
  readinessLabel: string;
  hasPortfolio: boolean;
  hasActionableRecommendations: boolean;
  executive: {
    totalRecommendations: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    pendingReviewCount: number;
    confirmedPoliciesPercent: number | null;
    portfolioReadinessPercent: number | null;
    intelligenceCompletionPercent: number | null;
    criticalItemsCount: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    explanation: string;
    priority: string;
    category: string;
    categoryLabel: string;
    policyId?: string;
    documentId?: string;
    affectedLabel?: string;
  }>;
};

export type ExportedMarketSummary = {
  hasPortfolio: boolean;
  comparisonEligibleCount: number;
  providersIdentified: string[];
  readiness: {
    percent: number;
    label: string;
    labelText: string;
    headline: string;
    subheadline: string;
  };
  overview: Array<{
    id: string;
    label: string;
    value: string;
    subtext: string;
    available: boolean;
  }>;
};

export type ExportedConsultingSummary = {
  hasPortfolio: boolean;
  readiness: {
    percent: number;
    label: string;
    labelText: string;
    headline: string;
    subheadline: string;
  };
  snapshot: ConsultingPortfolioSnapshot;
  checklist: Array<{
    id: string;
    title: string;
    status: string;
    progressPercent: number | null;
  }>;
};

function toExportedProfile(profile: CurrentProfile): ExportedProfile {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    language: profile.language,
    currency: profile.currency,
    dateFormat: profile.dateFormat,
    notificationEmail: profile.notificationEmail,
    notificationPush: profile.notificationPush,
    notificationSms: profile.notificationSms,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    hasProfileRow: profile.hasProfileRow,
  };
}

function toExportedDocument(document: UserDocument): ExportedDocument {
  return {
    id: document.id,
    fileName: document.fileName,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

async function getCurrentUserExtractionCorrectionsForExport(): Promise<
  ExportedExtractionCorrection[]
> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("extraction_corrections")
    .select(
      "id, policy_id, document_id, correction_type, correction_kind, correction_source, field_name, field_path, provider, policy_type, coverage_name, coverage_kind, coverage_stable_key, ai_value_before, corrected_value_after, confidence_before, previous_assignment, corrected_assignment, reviewed_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    policyId: row.policy_id,
    documentId: row.document_id,
    correctionType: row.correction_type,
    correctionKind: row.correction_kind,
    correctionSource: row.correction_source,
    fieldName: row.field_name,
    fieldPath: row.field_path,
    provider: row.provider,
    policyType: row.policy_type,
    coverageName: row.coverage_name,
    coverageKind: row.coverage_kind,
    coverageStableKey: row.coverage_stable_key,
    aiValueBefore: row.ai_value_before,
    correctedValueAfter: row.corrected_value_after,
    confidenceBefore: row.confidence_before,
    previousAssignment: row.previous_assignment as Record<string, unknown> | null,
    correctedAssignment: row.corrected_assignment as Record<string, unknown>,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  }));
}

export const buildCurrentUserDataExport = cache(
  async (): Promise<AtlasDataExportBundle | null> => {
    const profile = await getCurrentProfile();

    if (!profile) {
      return null;
    }

    const [
      documents,
      policies,
      extractionCorrections,
      recommendations,
      market,
      consulting,
    ] = await Promise.all([
      getCurrentUserDocuments(),
      getCurrentUserPolicies(),
      getCurrentUserExtractionCorrectionsForExport(),
      getRecommendationsIntelligence(),
      getMarketIntelligence(),
      getConsultingIntelligence(),
    ]);

    const generatedAt = new Date().toISOString();

    return {
      exportVersion: ATLAS_DATA_EXPORT_VERSION,
      generatedAt,
      accountId: profile.id,
      profile: toExportedProfile(profile),
      documents: documents.map(toExportedDocument),
      policies,
      extractionCorrections,
      intelligence: {
        recommendations: {
          readinessLabel: recommendations.readinessLabel,
          hasPortfolio: recommendations.hasPortfolio,
          hasActionableRecommendations: recommendations.hasActionableRecommendations,
          executive: recommendations.executive,
          recommendations: recommendations.recommendations.map((item) => ({
            id: item.id,
            title: item.title,
            explanation: item.explanation,
            priority: item.priority,
            category: item.category,
            categoryLabel: item.categoryLabel,
            policyId: item.policyId,
            documentId: item.documentId,
            affectedLabel: item.affectedLabel,
          })),
        },
        market: {
          hasPortfolio: market.hasPortfolio,
          comparisonEligibleCount: market.comparisonEligibleCount,
          providersIdentified: market.providersIdentified,
          readiness: {
            percent: market.readiness.percent,
            label: market.readiness.label,
            labelText: market.readiness.labelText,
            headline: market.readiness.headline,
            subheadline: market.readiness.subheadline,
          },
          overview: market.overview.map((signal) => ({
            id: signal.id,
            label: signal.label,
            value: signal.value,
            subtext: signal.subtext,
            available: signal.available,
          })),
        },
        consulting: {
          hasPortfolio: consulting.hasPortfolio,
          readiness: {
            percent: consulting.readiness.percent,
            label: consulting.readiness.label,
            labelText: consulting.readiness.labelText,
            headline: consulting.readiness.headline,
            subheadline: consulting.readiness.subheadline,
          },
          snapshot: consulting.snapshot,
          checklist: consulting.checklist.map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            progressPercent: item.progressPercent,
          })),
        },
      },
      meta: {
        documentCount: documents.length,
        policyCount: policies.length,
        correctionCount: extractionCorrections.length,
        includesRawPdfFiles: false,
        includesServiceSecrets: false,
      },
    };
  }
);

function escapeCsvValue(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

const POLICY_CSV_HEADERS = [
  "id",
  "provider",
  "policy_type",
  "policy_category_label",
  "policy_number",
  "premium_amount",
  "premium_frequency",
  "currency",
  "deductible",
  "coverage_amount",
  "start_date",
  "end_date",
  "renewal_date",
  "status",
  "source",
  "requires_review",
  "document_id",
  "created_at",
  "updated_at",
] as const;

export function buildPoliciesCsv(policies: UserPolicy[]): string {
  const rows = policies.map((policy) =>
    [
      policy.id,
      policy.provider,
      policy.policyType,
      policy.policyCategoryLabel,
      policy.policyNumber,
      policy.premiumAmount,
      policy.premiumFrequency,
      policy.currency,
      policy.deductible,
      policy.coverageAmount,
      policy.startDate,
      policy.endDate,
      policy.renewalDate,
      policy.status,
      policy.source,
      policy.requiresReview,
      policy.documentId,
      policy.createdAt,
      policy.updatedAt,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [POLICY_CSV_HEADERS.join(","), ...rows].join("\n");
}

export function getExportFilename(
  format: "json" | "csv",
  generatedAt: string
): string {
  const datePart = generatedAt.slice(0, 10);
  return format === "json"
    ? `atlas-export-${datePart}.json`
    : `atlas-policies-${datePart}.csv`;
}
