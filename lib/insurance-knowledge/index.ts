export {
  SWISS_INSURANCE_KNOWLEDGE_RULES,
} from "@/lib/insurance-knowledge/ch";
export {
  buildExtractionKnowledgeContext,
  formatSwissInsuranceKnowledgePromptSection,
  getSwissInsuranceKnowledgeHints,
} from "@/lib/insurance-knowledge/select-hints";
export {
  isSwissKnowledgeRuleId,
  SWISS_KNOWLEDGE_RULE_ID_PATTERN,
  type SwissInsuranceKnowledgeHintInput,
  type SwissInsuranceKnowledgeHintsResult,
  type SwissKnowledgeCategory,
  type SwissKnowledgeRule,
} from "@/lib/insurance-knowledge/types";
export {
  insuranceCategories,
  insuranceCategoryDefinitions,
  isInsuranceCategory,
  type InsuranceCategory,
} from "@/lib/insurance-knowledge/categories";
export {
  classifyInsuranceDocument,
  detectInsuranceDocumentLanguage,
  insuranceDocumentTypes,
  insuranceDocumentTypeLabels,
  isInsuranceDocumentType,
  type InsuranceDocumentType,
  type InsuranceDocumentLanguage,
} from "@/lib/insurance-knowledge/document-types";
export {
  canonicalCoverageTaxonomy,
  canonicalCoverageTypes,
  getCanonicalCoverageDefinition,
} from "@/lib/insurance-knowledge/coverage-taxonomy";
export {
  recognizeSwissInsurer,
  swissInsurerRegistry,
} from "@/lib/insurance-knowledge/insurer-registry";
export { swissInsuranceTerminology } from "@/lib/insurance-knowledge/terminology";
export {
  categorySpecificExtractionFields,
  factProvenanceValues,
  unknownFact,
  type CanonicalCoverageItem,
  type CanonicalPolicyExtraction,
  type ExtractedFact,
  type FactProvenance,
} from "@/lib/insurance-knowledge/extraction-schema";
export {
  annualizePremium,
  canPersistAsPersonalPolicy,
  normalizeCoverageLabel,
  normalizeInsurerLabel,
} from "@/lib/insurance-knowledge/normalization";
