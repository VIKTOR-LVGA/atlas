-- Roll back only the document taxonomy expansion from 20261018120000.
-- This intentionally aborts if quote/offer rows would violate the old check.
begin;

do $$
begin
  if exists (
    select 1 from public.documents where document_type in ('quote', 'offer')
  ) then
    raise exception 'rollback blocked: documents with quote/offer type exist';
  end if;
end;
$$;

alter table public.documents
  drop constraint if exists documents_document_type_check,
  add constraint documents_document_type_check check (document_type in (
    'policy', 'general_conditions', 'supplementary_conditions', 'invoice',
    'premium_notice', 'renewal_notice', 'claim_document', 'coverage_summary',
    'customer_information', 'certificate', 'unknown'
  ));

commit;
