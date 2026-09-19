create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid,
  opportunity_type text not null,
  title text not null,
  description text not null,
  status text not null default 'new',
  source text not null default 'atlas_rules',
  source_key text,
  detected_at timestamptz not null default now(),
  seen_at timestamptz,
  dismissed_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_policy_owner_fk
    foreign key (policy_id, user_id)
    references public.policies (id, user_id)
    on delete set null (policy_id),
  constraint opportunities_type_check check (opportunity_type in (
    'upcoming_expiry', 'missing_premium', 'missing_document',
    'incomplete_policy', 'periodic_review'
  )),
  constraint opportunities_status_check
    check (status in ('new', 'seen', 'dismissed', 'resolved')),
  constraint opportunities_metadata_check
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768),
  constraint opportunities_text_check
    check (char_length(title) between 1 and 240 and char_length(description) between 1 and 2000),
  constraint opportunities_id_user_id_unique unique (id, user_id),
  constraint opportunities_user_source_key_unique unique (user_id, source_key)
);

create index if not exists opportunities_user_status_detected_idx
  on public.opportunities (user_id, status, detected_at desc);
create index if not exists opportunities_policy_id_idx
  on public.opportunities (policy_id)
  where policy_id is not null;

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  email text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokers_email_unique unique (email)
);

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted',
  request_type text not null default 'portfolio_review',
  message text,
  preferred_contact_method text,
  preferred_contact_time text,
  consent_given_at timestamptz not null,
  privacy_version text,
  source_opportunity_id uuid,
  assigned_broker_id uuid references public.brokers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint consultation_requests_opportunity_owner_fk
    foreign key (source_opportunity_id, user_id)
    references public.opportunities (id, user_id)
    on delete set null (source_opportunity_id),
  constraint consultation_requests_status_check check (status in (
    'submitted', 'assigned', 'contacted', 'consultation_scheduled',
    'in_review', 'completed', 'cancelled'
  )),
  constraint consultation_requests_type_check
    check (request_type in ('portfolio_review', 'policy_review', 'general_question')),
  constraint consultation_requests_contact_check
    check (preferred_contact_method is null or preferred_contact_method in ('email', 'phone')),
  constraint consultation_requests_message_size_check
    check (message is null or char_length(message) <= 4000),
  constraint consultation_requests_id_user_id_unique unique (id, user_id)
);

create index if not exists consultation_requests_user_status_idx
  on public.consultation_requests (user_id, status, created_at desc);
create index if not exists consultation_requests_broker_status_idx
  on public.consultation_requests (assigned_broker_id, status)
  where assigned_broker_id is not null;

create table if not exists public.broker_assignments (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  broker_id uuid not null references public.brokers(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  assignment_reason text,
  constraint broker_assignments_dates_check
    check (unassigned_at is null or unassigned_at >= assigned_at)
);

create index if not exists broker_assignments_request_idx
  on public.broker_assignments (consultation_request_id, assigned_at desc);
create unique index if not exists broker_assignments_one_active_idx
  on public.broker_assignments (consultation_request_id)
  where unassigned_at is null;

create table if not exists public.consultation_events (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_type text not null,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint consultation_events_actor_check
    check (actor_type in ('consumer', 'broker', 'system', 'admin')),
  constraint consultation_events_metadata_check
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768)
);

create index if not exists consultation_events_request_created_idx
  on public.consultation_events (consultation_request_id, created_at);

alter table public.opportunities enable row level security;
alter table public.consultation_requests enable row level security;
alter table public.brokers enable row level security;
alter table public.broker_assignments enable row level security;
alter table public.consultation_events enable row level security;

grant select, insert, update, delete on table public.opportunities to authenticated;
revoke all on table public.brokers from anon, authenticated;
revoke all on table public.broker_assignments from anon, authenticated;
revoke all on table public.consultation_requests from anon, authenticated;
revoke all on table public.consultation_events from anon, authenticated;
grant select on table public.consultation_requests to authenticated;
grant insert (
  user_id, request_type, message, preferred_contact_method,
  preferred_contact_time, consent_given_at, privacy_version, source_opportunity_id
) on table public.consultation_requests to authenticated;
grant select on table public.consultation_events to authenticated;

create policy "Users own opportunities"
  on public.opportunities for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (policy_id is null or exists (
      select 1 from public.policies p
      where p.id = policy_id and p.user_id = (select auth.uid())
    ))
  );

create policy "Users read own consultation requests"
  on public.consultation_requests for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users submit own consultation requests"
  on public.consultation_requests for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'submitted'
    and assigned_broker_id is null
    and closed_at is null
    and consent_given_at is not null
    and (source_opportunity_id is null or exists (
      select 1 from public.opportunities o
      where o.id = source_opportunity_id and o.user_id = (select auth.uid())
    ))
  );

create policy "Users read events for own consultation requests"
  on public.consultation_events for select to authenticated
  using (exists (
    select 1 from public.consultation_requests cr
    where cr.id = consultation_request_id and cr.user_id = (select auth.uid())
  ));

create or replace function public.record_consultation_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.consultation_events (
    consultation_request_id, event_type, to_status, actor_type, actor_id
  ) values (
    new.id, 'request_submitted', new.status, 'consumer', new.user_id
  );
  return new;
end;
$$;

create trigger consultation_requests_record_submission
  after insert on public.consultation_requests
  for each row execute function public.record_consultation_submission();

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_row_updated_at();
create trigger brokers_set_updated_at
  before update on public.brokers
  for each row execute function public.set_row_updated_at();
create trigger consultation_requests_set_updated_at
  before update on public.consultation_requests
  for each row execute function public.set_row_updated_at();
