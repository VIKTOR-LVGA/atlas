export type CheckupResult = {
  id: string | null;
  policiesAnalyzed: number;
  annualCostKnown: number | null;
  categoriesCovered: number;
  dataCompletenessPercent: number;
  clearItems: string[];
  verifyItems: string[];
  missingItems: string[];
  overlaps: string[];
  recentChanges: string[];
  upcomingDeadlines: string[];
  usefulQuestions: string[];
  createdAt: string;
};
