-- Created only after the Swiss knowledge benchmark validated the canonical model.

alter table public.policies
  drop constraint if exists policies_policy_type_check,
  add constraint policies_policy_type_check
  check (policy_type in (
    'health', 'liability', 'household', 'car', 'legal',
    'travel', 'life', 'pension', 'building', 'pet', 'other'
  ));

create unique index if not exists documents_id_user_id_uidx
  on public.documents (id, user_id);

alter table public.documents
  add column if not exists document_type text not null default 'unknown',
  add column if not exists document_language text,
  add column if not exists recognized_insurer text,
  add column if not exists classification_confidence numeric,
  add column if not exists classification_metadata jsonb not null default '{}'::jsonb;

alter table public.documents
  drop constraint if exists documents_document_type_check,
  add constraint documents_document_type_check check (document_type in (
    'policy', 'general_conditions', 'supplementary_conditions', 'invoice',
    'premium_notice', 'renewal_notice', 'claim_document', 'coverage_summary',
    'customer_information', 'certificate', 'unknown'
  )),
  drop constraint if exists documents_language_check,
  add constraint documents_language_check
    check (document_language is null or document_language in ('it', 'de', 'fr', 'other')),
  drop constraint if exists documents_classification_confidence_check,
  add constraint documents_classification_confidence_check
    check (classification_confidence is null or classification_confidence between 0 and 100),
  drop constraint if exists documents_classification_metadata_check,
  add constraint documents_classification_metadata_check
    check (
      jsonb_typeof(classification_metadata) = 'object'
      and octet_length(classification_metadata::text) <= 32768
    );

create index if not exists documents_user_document_type_idx
  on public.documents (user_id, document_type, created_at desc);

create table if not exists public.policy_coverages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null,
  canonical_type text not null,
  original_label text not null,
  insurance_category text not null,
  coverage_status text not null default 'included',
  coverage_limit numeric,
  limit_unit text,
  currency text,
  deductible numeric,
  deductible_unit text,
  reimbursement_percent numeric,
  waiting_period_days integer,
  territorial_scope text,
  description text,
  source text not null,
  provenance text not null default 'explicit',
  confidence numeric,
  source_document_id uuid,
  source_page integer,
  evidence text,
  family_member_id uuid,
  property_id uuid,
  vehicle_id uuid,
  effective_from date,
  effective_until date,
  terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_coverages_policy_owner_fk
    foreign key (policy_id, user_id)
    references public.policies (id, user_id)
    on delete cascade,
  constraint policy_coverages_document_owner_fk
    foreign key (source_document_id, user_id)
    references public.documents (id, user_id)
    on delete set null (source_document_id),
  constraint policy_coverages_family_owner_fk
    foreign key (family_member_id, user_id)
    references public.family_members (id, user_id)
    on delete set null (family_member_id),
  constraint policy_coverages_property_owner_fk
    foreign key (property_id, user_id)
    references public.properties (id, user_id)
    on delete set null (property_id),
  constraint policy_coverages_vehicle_owner_fk
    foreign key (vehicle_id, user_id)
    references public.vehicles (id, user_id)
    on delete set null (vehicle_id),
  constraint policy_coverages_source_check
    check (source in ('manual', 'extracted', 'imported')),
  constraint policy_coverages_provenance_check
    check (provenance in ('explicit', 'derived', 'unknown')),
  constraint policy_coverages_status_check
    check (coverage_status in ('included', 'excluded', 'conditional', 'unknown')),
  constraint policy_coverages_confidence_check
    check (confidence is null or confidence between 0 and 100),
  constraint policy_coverages_reimbursement_check
    check (reimbursement_percent is null or reimbursement_percent between 0 and 100),
  constraint policy_coverages_amounts_check
    check (
      (coverage_limit is null or coverage_limit >= 0)
      and (deductible is null or deductible >= 0)
      and (waiting_period_days is null or waiting_period_days >= 0)
    ),
  constraint policy_coverages_dates_check
    check (effective_until is null or effective_from is null or effective_until >= effective_from),
  constraint policy_coverages_currency_check
    check (currency is null or char_length(currency) = 3),
  constraint policy_coverages_text_check
    check (
      char_length(trim(canonical_type)) between 1 and 120
      and char_length(trim(original_label)) between 1 and 240
      and (evidence is null or char_length(evidence) <= 4000)
    ),
  constraint policy_coverages_terms_check
    check (jsonb_typeof(terms) = 'object' and octet_length(terms::text) <= 32768)
);

comment on table public.policy_coverages is
  'Canonical purchased coverage facts. original_label preserves insurer wording; provenance prevents knowledge-base assumptions from becoming customer facts.';

create index if not exists policy_coverages_policy_id_idx
  on public.policy_coverages (policy_id, created_at);
create index if not exists policy_coverages_user_category_idx
  on public.policy_coverages (user_id, insurance_category);
create index if not exists policy_coverages_source_document_id_idx
  on public.policy_coverages (source_document_id)
  where source_document_id is not null;

alter table public.policy_coverages enable row level security;
grant select, insert, update, delete on table public.policy_coverages to authenticated;

create policy "Users own policy coverages through policy"
  on public.policy_coverages for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    )
    and (source_document_id is null or exists (
      select 1 from public.documents d
      where d.id = source_document_id and d.user_id = (select auth.uid())
    ))
    and (family_member_id is null or exists (
      select 1 from public.family_members fm
      where fm.id = family_member_id and fm.user_id = (select auth.uid())
    ))
    and (property_id is null or exists (
      select 1 from public.properties pr
      where pr.id = property_id and pr.user_id = (select auth.uid())
    ))
    and (vehicle_id is null or exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = (select auth.uid())
    ))
  );

create trigger policy_coverages_set_updated_at
  before update on public.policy_coverages
  for each row execute function public.set_row_updated_at();
