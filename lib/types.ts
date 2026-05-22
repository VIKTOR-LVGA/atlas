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

export type DocumentStatus = "uploaded" | "analyzing" | "completed" | "error";

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
  status: DocumentStatus;
  policyId?: string;
  size: string;
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

export interface CurrentProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasProfileRow: boolean;
}
