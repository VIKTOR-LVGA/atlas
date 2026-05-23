export type PolicyCategory =
  | "health"
  | "car"
  | "household"
  | "liability"
  | "legal"
  | "life";

export type PolicyStatus = "active" | "expiring" | "review";

export type PolicyHealthStatus = "ok" | "attention" | "critical";

export type AlertSeverity = "high" | "medium" | "low" | "info";

export type DocumentStatus = "uploaded" | "processing" | "analyzed" | "failed";

type DemoDocumentStatus =
  | DocumentStatus
  | "analyzing"
  | "completed"
  | "error";

export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationDifficulty = "easy" | "moderate" | "complex";

export interface Policy {
  id: string;
  name: string;
  policyNumber: string;
  insurer: string;
  category: PolicyCategory;
  status: PolicyStatus;
  healthStatus: PolicyHealthStatus;
  annualPremium: number;
  deductible: number;
  coverageScore: number;
  renewalDate: string;
  daysUntilRenewal: number;
  includedCoverages: string[];
  excludedCoverages: string[];
  alerts: Alert[];
  recommendations: Recommendation[];
  documentIds: string[];
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  policyId?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  estimatedImpact: string;
  difficulty: RecommendationDifficulty;
  nextStep: string;
  category?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadedAt: string;
  status: DemoDocumentStatus;
  policyId?: string;
  size: string;
}

export interface UserDocument {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type PolicyPremiumFrequency =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

export type TypedPolicyType =
  | "health"
  | "liability"
  | "household"
  | "car"
  | "legal"
  | "other";

export type PolicySource = "manual" | "ai_draft";

export type PolicyDetailScalar = string | number | boolean | null;

export type PolicyFieldConfidenceKey =
  | "provider"
  | "policy_type"
  | "policy_number"
  | "premium_amount"
  | "premium_frequency"
  | "deductible"
  | "start_date"
  | "end_date"
  | "renewal_date"
  | "currency"
  | "coverage_amount"
  | "details";

export interface PolicyFieldConfidence {
  value: PolicyDetailScalar;
  confidence: number | null;
  uncertain: boolean;
  evidence?: string | null;
}

export type PolicyFieldConfidenceMap = Partial<
  Record<PolicyFieldConfidenceKey, PolicyFieldConfidence>
>;

export interface PolicyCoverageDiscount {
  label: string | null;
  amount: number | null;
  notes?: string | null;
}

export type PolicyCoverageAssignmentSource = "manual" | "ai" | string;

export interface PolicyCoverageDetail {
  name: string;
  stable_key?: string | null;
  policy_type?: TypedPolicyType | null;
  coverage_type?: string | null;
  category_label?: string | null;
  premium_gross?: number | null;
  premium_amount?: number | null;
  premium_final?: number | null;
  premium_frequency?: PolicyPremiumFrequency | null;
  discounts?: PolicyCoverageDiscount[];
  deductible?: number | null;
  franchise?: number | null;
  coverage_amount?: number | null;
  insured_person_name?: string | null;
  insured_number?: string | null;
  person_index?: number | null;
  applies_to?: string | null;
  section_id?: string | null;
  source_page?: number | null;
  source_order?: number | null;
  confidence?: number | null;
  ownership_confidence?: number | null;
  assignment_source?: PolicyCoverageAssignmentSource | null;
  assigned_at?: string | null;
  uncertain?: boolean;
  notes?: string | null;
}

export interface PolicyInsuredPersonDetail {
  name: string | null;
  stable_key?: string | null;
  birth_date?: string | null;
  insured_number?: string | null;
  customer_number?: string | null;
  policy_number?: string | null;
  section_id?: string | null;
  source_order?: number | null;
  premium_amount?: number | null;
  premium_frequency?: PolicyPremiumFrequency | null;
  total_monthly_premium?: number | null;
  base_premium?: number | null;
  complementary_premium?: number | null;
  franchise?: number | null;
  deductible?: number | null;
  model?: string | null;
  accident_covered?: boolean | null;
  coverages?: PolicyCoverageDetail[];
  confidence?: number | null;
  uncertain?: boolean;
}

export interface PolicyBaseInsuranceDetail {
  name?: string | null;
  model?: string | null;
  premium_amount?: number | null;
  franchise?: number | null;
  notes?: string | null;
}

export interface PolicyPremiumSummaryDetail {
  total_monthly?: number | null;
  total_annual?: number | null;
  gross_monthly?: number | null;
  discounts_total?: number | null;
  final_monthly?: number | null;
  currency?: string | null;
  notes?: string | null;
}

export interface PolicyProductDetail {
  name: string;
  coverage_type?: string | null;
  premium_gross?: number | null;
  premium_amount?: number | null;
  premium_final?: number | null;
  premium_frequency?: PolicyPremiumFrequency | null;
  discounts?: PolicyCoverageDiscount[];
  insured_person_name?: string | null;
  insured_number?: string | null;
  person_index?: number | null;
  applies_to?: string | null;
  section_id?: string | null;
  source_page?: number | null;
  source_order?: number | null;
  confidence?: number | null;
  ownership_confidence?: number | null;
  uncertain?: boolean;
  notes?: string | null;
}

export interface PolicyExtractionMetadata {
  matched_keywords?: string[];
  inferred_sections?: string[];
  warnings?: string[];
  provider_raw?: string | null;
  normalized_provider?: string | null;
  provider_aliases_matched?: string[];
  detected_languages?: string[];
  source_hints?: string[];
}

export type PolicyDetailValue =
  | PolicyDetailScalar
  | string[]
  | PolicyCoverageDetail[]
  | PolicyInsuredPersonDetail[]
  | PolicyProductDetail[]
  | PolicyBaseInsuranceDetail
  | PolicyPremiumSummaryDetail
  | PolicyFieldConfidenceMap
  | PolicyExtractionMetadata;

export type PolicyDetails = {
  coverage_kind?: string | null;
  franchise?: number | null;
  deductible?: number | null;
  model?: string | null;
  complementary?: boolean;
  hospital_coverage?: string | null;
  accident_covered?: boolean | null;
  telemedicine?: boolean | null;
  family_doctor_model?: boolean | null;
  base_insurance?: PolicyBaseInsuranceDetail | null;
  travel_coverage?: string | null;
  legal_protection?: string | null;
  premium_summary?: PolicyPremiumSummaryDetail | null;
  collective_contract?: boolean | null;
  canton_or_premium_region?: string | null;
  cancellation_deadline?: string | null;
  complementary_products?: PolicyProductDetail[];
  insured_people?: PolicyInsuredPersonDetail[];
  coverages?: PolicyCoverageDetail[];
  products?: PolicyProductDetail[];
  field_confidence?: PolicyFieldConfidenceMap;
  extraction_metadata?: PolicyExtractionMetadata;
  plate_number?: string | null;
  casco?: string | null;
  bonus_malus?: string | null;
  annual_km?: number | null;
  insured_sum?: number | null;
  glass_coverage?: boolean;
  theft_coverage?: boolean;
  liability_limit?: number | null;
  household_members_included?: number | null;
  private_legal?: boolean;
  traffic_legal?: boolean;
  coverage_region?: string | null;
  generic_details?: string | null;
};

export interface UserPolicyDocument {
  id: string;
  fileName: string;
}

export interface UserPolicy {
  id: string;
  userId: string;
  documentId: string | null;
  document: UserPolicyDocument | null;
  provider: string;
  policyType: TypedPolicyType;
  policyCategoryLabel: string | null;
  policyNumber: string | null;
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  deductible: number | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  currency: string;
  coverageAmount: number | null;
  details: PolicyDetails;
  notes: string | null;
  extractionConfidence: number | null;
  extractionNotes: string | null;
  source: PolicySource;
  requiresReview: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyInput {
  documentId: string | null;
  provider: string;
  policyType: TypedPolicyType;
  policyCategoryLabel: string | null;
  policyNumber: string | null;
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  deductible: number | null;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  currency: string;
  coverageAmount: number | null;
  details: PolicyDetails;
  notes: string | null;
}

export interface PolicyCreationMetadata {
  source?: PolicySource;
  requiresReview?: boolean;
  extractionConfidence?: number | null;
  extractionNotes?: string | null;
}

export interface Benchmark {
  id: string;
  category: string;
  label: string;
  userPremium: number;
  marketMedian: number;
  marketRange: [number, number];
  percentile: number;
}

export interface AnalysisItem {
  id: string;
  type: "duplicate" | "under" | "over" | "missing";
  title: string;
  description: string;
  severity: AlertSeverity;
  policies?: string[];
  priority: number;
}

export interface UserProfile {
  name: string;
  email: string;
  canton: string;
  memberSince: string;
}

export type ProfileLanguage = "it" | "de" | "fr" | "en";

export type ProfileCurrency = "CHF";

export type ProfileDateFormat = "DD/MM/YYYY" | "YYYY-MM-DD";

export interface CurrentProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  phone: string | null;
  language: ProfileLanguage;
  currency: ProfileCurrency;
  dateFormat: ProfileDateFormat;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  hasProfileRow: boolean;
}

export interface CurrentProfileUpdate {
  fullName: string;
  phone: string | null;
  language: ProfileLanguage;
  currency: ProfileCurrency;
  dateFormat: ProfileDateFormat;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
}
