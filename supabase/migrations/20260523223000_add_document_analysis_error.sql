alter table public.documents
  add column if not exists analysis_error text;

comment on column public.documents.analysis_error is
  'Internal diagnostic reason for the latest failed document analysis. Do not display verbatim in the product UI.';
