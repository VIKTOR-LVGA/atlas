export type AttentionPriority = "info" | "attention" | "important";

export type AttentionItemType =
  | "upcoming_expiry"
  | "upcoming_renewal"
  | "cancellation_deadline"
  | "missing_premium"
  | "missing_document"
  | "document_obsolete"
  | "parsing_incomplete"
  | "coverage_needs_verification"
  | "possible_overlap"
  | "premium_changed"
  | "policy_without_current_document"
  | "consultation_pending"
  | "claim_open"
  | "update_needed"
  | "incomplete_policy"
  | "periodic_review";

export type AttentionItem = {
  id: string;
  type: AttentionItemType;
  priority: AttentionPriority;
  title: string;
  description: string;
  policyId: string | null;
  documentId: string | null;
  ctaLabel: string;
  ctaHref: string;
  sourceKey: string;
  status: "new" | "seen" | "dismissed" | "resolved";
};

export type CoverageMapStatus =
  | "covered"
  | "partially_known"
  | "needs_verification"
  | "no_policy_found"
  | "not_applicable";

export type CoverageMapCategoryId =
  | "home_building"
  | "household"
  | "liability"
  | "mobility"
  | "health"
  | "travel"
  | "legal"
  | "life"
  | "accident"
  | "pension"
  | "other";
