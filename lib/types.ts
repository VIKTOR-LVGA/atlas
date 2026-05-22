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

export type PolicySource = "manual" | "ai_draft";

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
  policyType: string;
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  deductible: number | null;
  renewalDate: string | null;
  notes: string | null;
  source: PolicySource;
  requiresReview: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyInput {
  documentId: string | null;
  provider: string;
  policyType: string;
  premiumAmount: number | null;
  premiumFrequency: PolicyPremiumFrequency;
  deductible: number | null;
  renewalDate: string | null;
  notes: string | null;
}

export interface PolicyCreationMetadata {
  source?: PolicySource;
  requiresReview?: boolean;
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
