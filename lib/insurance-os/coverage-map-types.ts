/**
 * Client-safe coverage map view types (no server-only import).
 */
import type { VerificationStatus } from "@/lib/insurance-os/verification";
import type { CoverageMapCategoryId, CoverageMapStatus } from "@/lib/insurance-os/shared-types";

export type CoverageMapPolicyRef = {
  id: string;
  provider: string;
  policyType: string;
  policyNumber: string | null;
  premiumAmount: number | null;
  deductible: number | null;
};

export type CoverageMapFact = {
  id: string;
  label: string;
  status: string;
  limit: number | null;
  deductible: number | null;
  verificationStatus: VerificationStatus;
  sourceDocumentId: string | null;
  sourcePage: number | null;
  evidence: string | null;
  policyId: string;
};

export type CoverageMapCategoryView = {
  id: CoverageMapCategoryId;
  label: string;
  description: string;
  status: CoverageMapStatus;
  policies: CoverageMapPolicyRef[];
  coverages: CoverageMapFact[];
  exclusions: CoverageMapFact[];
  needsVerification: CoverageMapFact[];
  explanation: string;
};

export type CoverageMapResult = {
  categories: CoverageMapCategoryView[];
  summary: {
    coveredCount: number;
    needsVerificationCount: number;
    noPolicyCount: number;
    activePolicies: number;
  };
  sourceHash: string;
};
