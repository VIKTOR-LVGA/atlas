-- Keep the database classification boundary aligned with the application taxonomy.
-- Quotes and offers are reference documents and never create a personal policy.

alter table public.documents
  drop constraint if exists documents_document_type_check,
  add constraint documents_document_type_check check (document_type in (
    'policy', 'general_conditions', 'supplementary_conditions', 'invoice',
    'premium_notice', 'renewal_notice', 'claim_document', 'coverage_summary',
    'customer_information', 'certificate', 'quote', 'offer', 'unknown'
  ));
