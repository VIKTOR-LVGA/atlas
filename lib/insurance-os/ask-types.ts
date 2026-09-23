import type { VerificationStatus } from "@/lib/insurance-os/verification";

export type AtlasSourceRef = {
  kind: "policy" | "document" | "coverage";
  id: string;
  label: string;
  href: string;
  page?: number | null;
  evidence?: string | null;
};

export type AtlasStructuredAnswer = {
  summary: string;
  sections: Array<{ title: string; body: string }>;
  verificationStatus: VerificationStatus;
  insufficientData: boolean;
};

export type AskAtlasResult = {
  answer: string;
  structured: AtlasStructuredAnswer;
  sources: AtlasSourceRef[];
  verificationStatus: VerificationStatus;
};

export type WhatIfResult = {
  scenario: string;
  relevantPolicies: Array<{ id: string; label: string; provider: string; href: string }>;
  findings: string[];
  uncertainties: string[];
  suggestedActions: string[];
  sources: AtlasSourceRef[];
  verificationStatus: VerificationStatus;
  answer: AskAtlasResult;
};
