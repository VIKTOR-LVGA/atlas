-- Insurance Operating System: additive Knowledge Graph extensions.
-- No drops of existing tables. Broker hibernation untouched.

-- ---------------------------------------------------------------------------
-- 1) Verification model on existing coverages + policies
-- ---------------------------------------------------------------------------
alter table public.policy_coverages
  add column if not exists verification_status text not null default 'inferred';

alter table public.policy_coverages
  drop constraint if exists policy_coverages_verification_status_check;

alter table public.policy_coverages
  add constraint policy_coverages_verification_status_check
  check (verification_status in (
    'confirmed', 'inferred', 'needs_verification', 'missing'
  ));

comment on column public.policy_coverages.verification_status is
  'CONFIRMED=explicit in document; INFERRED=derived with grounding; NEEDS_VERIFICATION=uncertain; MISSING=expected but absent.';

alter table public.policies
  add column if not exists notice_date date,
  add column if not exists cancellation_deadline date,
  add column if not exists verification_status text not null default 'needs_verification';

alter table public.policies
  drop constraint if exists policies_verification_status_check;

alter table public.policies
  add constraint policies_verification_status_check
  check (verification_status in (
    'confirmed', 'inferred', 'needs_verification', 'missing'
  ));

-- Backfill coverage verification from provenance
update public.policy_coverages
set verification_status = case
  when provenance = 'explicit' and coverage_status in ('included', 'excluded', 'conditional')
    then 'confirmed'
  when provenance = 'derived' then 'inferred'
  when coverage_status = 'unknown' then 'needs_verification'
  else 'inferred'
end
where verification_status = 'inferred'
  and (
    provenance is distinct from 'unknown'
    or coverage_status = 'unknown'
  );

-- ---------------------------------------------------------------------------
-- 2) Multi-document policy links (version / related docs)
-- ---------------------------------------------------------------------------
create table if not exists public.policy_document_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null,
  document_id uuid not null,
  link_role text not null default 'primary',
  is_current boolean not null default false,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  constraint policy_document_links_policy_owner_fk
    foreign key (policy_id, user_id)
    references public.policies (id, user_id)
    on delete cascade,
  constraint policy_document_links_document_owner_fk
    foreign key (document_id, user_id)
    references public.documents (id, user_id)
    on delete cascade,
  constraint policy_document_links_role_check
    check (link_role in (
      'primary', 'general_conditions', 'supplementary', 'invoice',
      'premium_notice', 'renewal', 'amendment', 'claim_related', 'other'
    )),
  constraint policy_document_links_unique unique (policy_id, document_id)
);

create unique index if not exists policy_document_links_one_current_idx
  on public.policy_document_links (policy_id)
  where is_current = true;

create index if not exists policy_document_links_user_idx
  on public.policy_document_links (user_id, created_at desc);

alter table public.policy_document_links enable row level security;
grant select, insert, update, delete on table public.policy_document_links to authenticated;

create policy "Users own policy document links"
  on public.policy_document_links for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = (select auth.uid())
    )
  );

-- Seed links from existing policies.document_id
insert into public.policy_document_links (user_id, policy_id, document_id, link_role, is_current)
select p.user_id, p.id, p.document_id, 'primary', true
from public.policies p
where p.document_id is not null
on conflict (policy_id, document_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Structured policy diffs (premium / coverage change history)
-- ---------------------------------------------------------------------------
create table if not exists public.policy_change_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null,
  source_document_id uuid,
  previous_document_id uuid,
  change_type text not null,
  field_path text not null,
  previous_value jsonb,
  new_value jsonb,
  display_summary text not null,
  verification_status text not null default 'inferred',
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint policy_change_events_policy_owner_fk
    foreign key (policy_id, user_id)
    references public.policies (id, user_id)
    on delete cascade,
  constraint policy_change_events_type_check
    check (change_type in (
      'premium', 'deductible', 'limit', 'coverage_added', 'coverage_removed',
      'exclusion_added', 'exclusion_removed', 'duration', 'insurer',
      'insured_asset', 'insured_person', 'terms', 'other'
    )),
  constraint policy_change_events_verification_check
    check (verification_status in (
      'confirmed', 'inferred', 'needs_verification', 'missing'
    )),
  constraint policy_change_events_idempotency_unique unique (user_id, idempotency_key),
  constraint policy_change_events_summary_check
    check (char_length(display_summary) between 1 and 500)
);

create index if not exists policy_change_events_policy_idx
  on public.policy_change_events (policy_id, created_at desc);

alter table public.policy_change_events enable row level security;
grant select, insert on table public.policy_change_events to authenticated;

create policy "Users own policy change events"
  on public.policy_change_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4) Attention items (Action Center) — extends opportunities types
-- ---------------------------------------------------------------------------
alter table public.opportunities
  drop constraint if exists opportunities_type_check;

alter table public.opportunities
  add constraint opportunities_type_check check (opportunity_type in (
    'upcoming_expiry', 'missing_premium', 'missing_document',
    'incomplete_policy', 'periodic_review',
    'upcoming_renewal', 'cancellation_deadline', 'document_obsolete',
    'parsing_incomplete', 'coverage_needs_verification', 'possible_overlap',
    'premium_changed', 'policy_without_current_document',
    'consultation_pending', 'claim_open', 'update_needed'
  ));

alter table public.opportunities
  add column if not exists priority text not null default 'attention',
  add column if not exists document_id uuid;

alter table public.opportunities
  drop constraint if exists opportunities_priority_check;

alter table public.opportunities
  add constraint opportunities_priority_check
  check (priority in ('info', 'attention', 'important'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunities_document_owner_fk'
  ) then
    alter table public.opportunities
      add constraint opportunities_document_owner_fk
      foreign key (document_id, user_id)
      references public.documents (id, user_id)
      on delete set null (document_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Unified insurance timeline (idempotent)
-- ---------------------------------------------------------------------------
create table if not exists public.insurance_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  entity_type text,
  entity_id uuid,
  policy_id uuid,
  document_id uuid,
  claim_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint insurance_timeline_events_type_check
    check (event_type in (
      'policy_added', 'document_uploaded', 'parsing_completed', 'parsing_failed',
      'premium_changed', 'coverage_changed', 'renewal', 'expiry',
      'consultation_requested', 'annual_checkup', 'claim_created',
      'claim_closed', 'document_updated', 'attention_resolved', 'other'
    )),
  constraint insurance_timeline_events_idempotency_unique
    unique (user_id, idempotency_key),
  constraint insurance_timeline_events_metadata_check
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768),
  constraint insurance_timeline_events_text_check
    check (
      char_length(title) between 1 and 240
      and (description is null or char_length(description) <= 2000)
    )
);

create index if not exists insurance_timeline_events_user_occurred_idx
  on public.insurance_timeline_events (user_id, occurred_at desc);

alter table public.insurance_timeline_events enable row level security;
grant select, insert, update, delete on table public.insurance_timeline_events to authenticated;

create policy "Users own timeline events"
  on public.insurance_timeline_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 6) Claims
-- ---------------------------------------------------------------------------
create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  category text not null,
  title text not null,
  description text,
  event_date date,
  event_location text,
  estimated_amount numeric,
  currency text default 'CHF',
  people_involved text,
  notes text,
  checklist jsonb not null default '[]'::jsonb,
  related_policy_ids uuid[] not null default '{}',
  matching_rationale jsonb not null default '{}'::jsonb,
  submitted_externally_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insurance_claims_status_check
    check (status in (
      'draft', 'ready', 'submitted_externally', 'in_progress', 'closed'
    )),
  constraint insurance_claims_category_check
    check (category in (
      'car_accident', 'home_damage', 'theft', 'travel', 'baggage',
      'liability', 'health_injury', 'legal', 'other'
    )),
  constraint insurance_claims_amount_check
    check (estimated_amount is null or estimated_amount >= 0),
  constraint insurance_claims_checklist_check
    check (jsonb_typeof(checklist) = 'array' and octet_length(checklist::text) <= 65536),
  constraint insurance_claims_text_check
    check (
      char_length(title) between 1 and 240
      and (description is null or char_length(description) <= 8000)
      and (notes is null or char_length(notes) <= 8000)
    ),
  constraint insurance_claims_id_user_unique unique (id, user_id)
);

create index if not exists insurance_claims_user_status_idx
  on public.insurance_claims (user_id, status, created_at desc);

create table if not exists public.insurance_claim_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  kind text not null default 'other',
  created_at timestamptz not null default now(),
  constraint insurance_claim_files_claim_owner_fk
    foreign key (claim_id, user_id)
    references public.insurance_claims (id, user_id)
    on delete cascade,
  constraint insurance_claim_files_kind_check
    check (kind in (
      'photo', 'invoice', 'police_report', 'damage_report',
      'medical', 'correspondence', 'other'
    )),
  constraint insurance_claim_files_path_check
    check (char_length(file_path) between 1 and 1024)
);

create index if not exists insurance_claim_files_claim_idx
  on public.insurance_claim_files (claim_id, created_at desc);

alter table public.insurance_claims enable row level security;
alter table public.insurance_claim_files enable row level security;

grant select, insert, update, delete on table public.insurance_claims to authenticated;
grant select, insert, update, delete on table public.insurance_claim_files to authenticated;

create policy "Users own claims"
  on public.insurance_claims for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users own claim files"
  on public.insurance_claim_files for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.insurance_claims c
      where c.id = claim_id and c.user_id = (select auth.uid())
    )
  );

-- Admin read via service role / control center (no broker access — portal hibernated)
-- Explicit deny for brokers when portal off is already via current_broker_id() null;
-- claims have no broker policies at all.

create trigger insurance_claims_set_updated_at
  before update on public.insurance_claims
  for each row execute function public.set_row_updated_at();

-- Private storage bucket for claim files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-documents',
  'claim-documents',
  false,
  20971520,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users manage own claim documents" on storage.objects;
create policy "Users manage own claim documents"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 7) Annual checkup snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.annual_checkups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'completed',
  summary jsonb not null default '{}'::jsonb,
  clear_items jsonb not null default '[]'::jsonb,
  verify_items jsonb not null default '[]'::jsonb,
  missing_items jsonb not null default '[]'::jsonb,
  overlaps_items jsonb not null default '[]'::jsonb,
  recent_changes jsonb not null default '[]'::jsonb,
  upcoming_deadlines jsonb not null default '[]'::jsonb,
  useful_questions jsonb not null default '[]'::jsonb,
  data_completeness_percent numeric,
  policies_analyzed integer not null default 0,
  annual_cost_known numeric,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint annual_checkups_status_check
    check (status in ('running', 'completed', 'failed')),
  constraint annual_checkups_idempotency_unique unique (user_id, idempotency_key),
  constraint annual_checkups_completeness_check
    check (
      data_completeness_percent is null
      or data_completeness_percent between 0 and 100
    )
);

create index if not exists annual_checkups_user_created_idx
  on public.annual_checkups (user_id, created_at desc);

alter table public.annual_checkups enable row level security;
grant select, insert on table public.annual_checkups to authenticated;

create policy "Users own annual checkups"
  on public.annual_checkups for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 8) Ask ATLAS / What-if conversations (grounded)
-- ---------------------------------------------------------------------------
create table if not exists public.atlas_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint atlas_conversations_mode_check
    check (mode in ('ask', 'what_if')),
  constraint atlas_conversations_id_user_unique unique (id, user_id)
);

create table if not exists public.atlas_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  role text not null,
  content text not null,
  structured_answer jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  verification_status text,
  created_at timestamptz not null default now(),
  constraint atlas_messages_conversation_owner_fk
    foreign key (conversation_id, user_id)
    references public.atlas_conversations (id, user_id)
    on delete cascade,
  constraint atlas_messages_role_check
    check (role in ('user', 'assistant', 'system')),
  constraint atlas_messages_verification_check
    check (
      verification_status is null
      or verification_status in (
        'confirmed', 'inferred', 'needs_verification', 'missing'
      )
    ),
  constraint atlas_messages_content_check
    check (char_length(content) between 1 and 16000),
  constraint atlas_messages_json_check
    check (
      jsonb_typeof(structured_answer) = 'object'
      and jsonb_typeof(sources) = 'array'
      and octet_length(structured_answer::text) <= 65536
      and octet_length(sources::text) <= 32768
    )
);

create index if not exists atlas_conversations_user_idx
  on public.atlas_conversations (user_id, updated_at desc);
create index if not exists atlas_messages_conversation_idx
  on public.atlas_messages (conversation_id, created_at);

alter table public.atlas_conversations enable row level security;
alter table public.atlas_messages enable row level security;

grant select, insert, update, delete on table public.atlas_conversations to authenticated;
grant select, insert, update, delete on table public.atlas_messages to authenticated;

create policy "Users own atlas conversations"
  on public.atlas_conversations for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users own atlas messages"
  on public.atlas_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.atlas_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create trigger atlas_conversations_set_updated_at
  before update on public.atlas_conversations
  for each row execute function public.set_row_updated_at();

-- ---------------------------------------------------------------------------
-- 9) Coverage map category snapshots (derived, per user)
-- ---------------------------------------------------------------------------
create table if not exists public.coverage_map_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categories jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  source_hash text not null,
  constraint coverage_map_snapshots_user_unique unique (user_id),
  constraint coverage_map_snapshots_json_check
    check (
      jsonb_typeof(categories) = 'array'
      and jsonb_typeof(summary) = 'object'
    )
);

alter table public.coverage_map_snapshots enable row level security;
grant select, insert, update, delete on table public.coverage_map_snapshots to authenticated;

create policy "Users own coverage map snapshots"
  on public.coverage_map_snapshots for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 10) Consumer benchmarks — aggregates only, privacy threshold
-- ---------------------------------------------------------------------------
create table if not exists public.consumer_benchmark_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_key text not null unique,
  category text not null,
  region text,
  age_band text,
  household_band text,
  coverage_level text,
  sample_size integer not null default 0,
  median_annual_premium numeric,
  p25_annual_premium numeric,
  p75_annual_premium numeric,
  currency text not null default 'CHF',
  privacy_masked boolean not null default true,
  computed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint consumer_benchmark_cohorts_sample_check
    check (sample_size >= 0),
  constraint consumer_benchmark_cohorts_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

-- No direct consumer INSERT/SELECT of raw rows via client for writing aggregates.
-- SELECT allowed only when sample_size meets threshold (enforced in RPC).
alter table public.consumer_benchmark_cohorts enable row level security;
revoke all on table public.consumer_benchmark_cohorts from anon, authenticated;

create or replace function public.get_consumer_benchmark(
  p_category text,
  p_region text default null,
  p_min_cohort integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.consumer_benchmark_cohorts%rowtype;
  min_size integer := greatest(coalesce(p_min_cohort, 30), 30);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into row
  from public.consumer_benchmark_cohorts c
  where c.category = p_category
    and (p_region is null or c.region = p_region)
    and c.privacy_masked = true
  order by c.sample_size desc, c.computed_at desc
  limit 1;

  if not found or row.sample_size < min_size then
    return jsonb_build_object(
      'available', false,
      'reason', 'insufficient_cohort',
      'min_cohort_size', min_size,
      'message', 'Non ci sono ancora abbastanza dati aggregati per creare un confronto affidabile.'
    );
  end if;

  return jsonb_build_object(
    'available', true,
    'category', row.category,
    'region', row.region,
    'sample_size', row.sample_size,
    'median_annual_premium', row.median_annual_premium,
    'p25_annual_premium', row.p25_annual_premium,
    'p75_annual_premium', row.p75_annual_premium,
    'currency', row.currency,
    'computed_at', row.computed_at
  );
end;
$$;

revoke all on function public.get_consumer_benchmark(text, text, integer) from public;
grant execute on function public.get_consumer_benchmark(text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 11) Privacy-safe product telemetry (no question/event text)
-- ---------------------------------------------------------------------------
create table if not exists public.atlas_product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint atlas_product_events_name_check
    check (event_name in (
      'coverage_map_opened', 'ask_atlas_question', 'what_if_started',
      'checkup_started', 'checkup_completed', 'claim_started',
      'claim_completed', 'consultation_requested'
    )),
  constraint atlas_product_events_metadata_check
    check (
      jsonb_typeof(metadata) = 'object'
      and octet_length(metadata::text) <= 2048
      and not (metadata ? 'question')
      and not (metadata ? 'description')
      and not (metadata ? 'content')
    )
);

alter table public.atlas_product_events enable row level security;
grant insert on table public.atlas_product_events to authenticated;

create policy "Users insert own product events"
  on public.atlas_product_events for insert to authenticated
  with check (
    user_id is null or (select auth.uid()) = user_id
  );

-- No consumer SELECT of telemetry.

-- ---------------------------------------------------------------------------
-- 12) Runtime flags for IOS features (server-side, not NEXT_PUBLIC)
-- ---------------------------------------------------------------------------
insert into public.atlas_runtime_flags (key, enabled, updated_at)
values
  ('coverage_intelligence', true, now()),
  ('ask_atlas', true, now()),
  ('claims', true, now()),
  ('annual_checkup', true, now()),
  ('benchmarks', true, now())
on conflict (key) do nothing;

comment on table public.policy_document_links is
  'Links documents to policies for multi-version / related-doc Knowledge Graph edges.';
comment on table public.insurance_claims is
  'Consumer Claim Mode workspaces. ATLAS prepares dossiers; does not submit to insurers.';
comment on table public.consumer_benchmark_cohorts is
  'Aggregated privacy-safe cohorts only. Never stores individual user ids.';
