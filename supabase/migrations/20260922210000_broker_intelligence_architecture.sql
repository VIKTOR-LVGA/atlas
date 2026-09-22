-- ATLAS B2B Architecture 2.0
-- Broker workspace enhancements + ATLAS Intelligence (privacy-safe aggregates)
-- Additive / backward compatible.

-- ---------------------------------------------------------------------------
-- Intelligence companies & entitlements (separate from broker role)
-- ---------------------------------------------------------------------------

create table if not exists public.intelligence_companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  company_type text not null default 'insurer'
    check (company_type in (
      'insurer', 'general_agency', 'insurance_group', 'market_partner', 'other'
    )),
  website text,
  country text not null default 'CH',
  market_scope text[] not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  module_access text[] not null default array[
    'market_overview',
    'switching',
    'premium_benchmark',
    'coverage_benchmark',
    'geography',
    'insurer_comparison'
  ],
  plan_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intelligence_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  work_email text not null,
  company_name text not null,
  legal_entity text,
  job_title text,
  company_type text not null default 'insurer',
  website text,
  country text not null default 'CH',
  market_scope text[] not null default '{}',
  access_reason text not null,
  desired_modules text[] not null default '{}',
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  company_id uuid references public.intelligence_companies(id) on delete set null,
  rejection_reason text,
  consent_given_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists intelligence_applications_one_open_per_user
  on public.intelligence_applications (user_id)
  where status in ('submitted', 'under_review');

create table if not exists public.intelligence_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.intelligence_companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'company_admin'
    check (member_role in ('company_admin', 'analyst', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.intelligence_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.intelligence_applications(id) on delete cascade,
  decision text not null,
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Snapshot tables (empty initially — no fake data)
-- ---------------------------------------------------------------------------

create table if not exists public.intelligence_market_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  canton text,
  age_band text,
  insurer text,
  observed_policies integer not null default 0,
  median_premium numeric,
  p25_premium numeric,
  p75_premium numeric,
  source_count integer not null default 0,
  privacy_masked boolean not null default true
);

create table if not exists public.intelligence_switching_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  canton text,
  from_insurer text not null,
  to_insurer text not null,
  switch_count integer not null default 0,
  reason_code text,
  privacy_masked boolean not null default true
);

create table if not exists public.intelligence_coverage_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  canton text,
  coverage_code text not null,
  penetration_pct numeric,
  source_count integer not null default 0,
  privacy_masked boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Broker practice messaging (contextual to consultation)
-- ---------------------------------------------------------------------------

create table if not exists public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('consumer', 'broker', 'admin', 'system')),
  message_kind text not null default 'user'
    check (message_kind in ('user', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists consultation_messages_request_idx
  on public.consultation_messages (consultation_request_id, created_at);

-- Broker accept / decline on assignment
alter table public.consultation_requests
  add column if not exists broker_acceptance text
    check (broker_acceptance is null or broker_acceptance in ('pending', 'accepted', 'declined'));

alter table public.consultation_requests
  add column if not exists broker_decline_reason text;

alter table public.consultation_requests
  add column if not exists broker_accepted_at timestamptz;

alter table public.consultation_requests
  add column if not exists broker_declined_at timestamptz;

-- Appointment proposal enrichment
alter table public.consultation_appointments
  add column if not exists proposal_status text;

alter table public.consultation_appointments
  add column if not exists proposed_by text;

alter table public.consultation_appointments
  add column if not exists consumer_note text;

-- Optional switch reason on contracts (aggregate later)
alter table public.broker_contracts
  add column if not exists switch_reason_code text;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.intelligence_companies enable row level security;
alter table public.intelligence_applications enable row level security;
alter table public.intelligence_memberships enable row level security;
alter table public.intelligence_application_reviews enable row level security;
alter table public.intelligence_market_snapshot enable row level security;
alter table public.intelligence_switching_snapshot enable row level security;
alter table public.intelligence_coverage_snapshot enable row level security;
alter table public.consultation_messages enable row level security;

grant select, insert on table public.consultation_messages to authenticated;
grant select on table public.intelligence_companies to authenticated;
grant select, insert on table public.intelligence_applications to authenticated;
grant select on table public.intelligence_memberships to authenticated;
grant select on table public.intelligence_market_snapshot to authenticated;
grant select on table public.intelligence_switching_snapshot to authenticated;
grant select on table public.intelligence_coverage_snapshot to authenticated;

create or replace function public.has_atlas_intelligence()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.intelligence_memberships m
    join public.intelligence_companies c on c.id = m.company_id
    where m.user_id = auth.uid()
      and m.active = true
      and c.status = 'active'
  )
  or public.current_user_role() = 'admin';
$$;

revoke all on function public.has_atlas_intelligence() from public, anon;
grant execute on function public.has_atlas_intelligence() to authenticated;

-- Applications: applicant insert/select own; admin all
drop policy if exists intelligence_applications_select on public.intelligence_applications;
create policy intelligence_applications_select on public.intelligence_applications
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

drop policy if exists intelligence_applications_insert on public.intelligence_applications;
create policy intelligence_applications_insert on public.intelligence_applications
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() in ('consumer', 'broker', 'admin')
  );

drop policy if exists intelligence_applications_admin on public.intelligence_applications;
create policy intelligence_applications_admin on public.intelligence_applications
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists intelligence_companies_member_select on public.intelligence_companies;
create policy intelligence_companies_member_select on public.intelligence_companies
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.intelligence_memberships m
      where m.company_id = intelligence_companies.id
        and m.user_id = auth.uid()
        and m.active = true
    )
  );

drop policy if exists intelligence_companies_admin on public.intelligence_companies;
create policy intelligence_companies_admin on public.intelligence_companies
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists intelligence_memberships_select on public.intelligence_memberships;
create policy intelligence_memberships_select on public.intelligence_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

drop policy if exists intelligence_memberships_admin on public.intelligence_memberships;
create policy intelligence_memberships_admin on public.intelligence_memberships
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists intelligence_reviews_admin on public.intelligence_application_reviews;
create policy intelligence_reviews_admin on public.intelligence_application_reviews
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Snapshots: only intelligence members / admin; never expose privacy_masked=false rows with small samples via RPC
drop policy if exists intelligence_market_select on public.intelligence_market_snapshot;
create policy intelligence_market_select on public.intelligence_market_snapshot
  for select to authenticated
  using (public.has_atlas_intelligence());

drop policy if exists intelligence_switching_select on public.intelligence_switching_snapshot;
create policy intelligence_switching_select on public.intelligence_switching_snapshot
  for select to authenticated
  using (public.has_atlas_intelligence());

drop policy if exists intelligence_coverage_select on public.intelligence_coverage_snapshot;
create policy intelligence_coverage_select on public.intelligence_coverage_snapshot
  for select to authenticated
  using (public.has_atlas_intelligence());

-- Messages: consumer owner, assigned broker, admin
drop policy if exists consultation_messages_select on public.consultation_messages;
create policy consultation_messages_select on public.consultation_messages
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_messages.consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and cr.assigned_broker_id is not null
            and exists (
              select 1 from public.brokers b
              where b.id = cr.assigned_broker_id
                and b.auth_user_id = auth.uid()
                and b.active = true
            )
          )
        )
    )
  );

drop policy if exists consultation_messages_insert on public.consultation_messages;
create policy consultation_messages_insert on public.consultation_messages
  for insert to authenticated
  with check (
    sender_user_id = auth.uid()
    and message_kind = 'user'
    and exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and exists (
              select 1 from public.brokers b
              where b.id = cr.assigned_broker_id
                and b.auth_user_id = auth.uid()
                and b.active = true
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.broker_respond_to_assignment(
  p_consultation_request_id uuid,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  broker_row public.brokers%rowtype;
  req public.consultation_requests%rowtype;
begin
  if public.current_user_role() <> 'broker' then
    raise exception 'broker role required';
  end if;
  if p_decision not in ('accepted', 'declined') then
    raise exception 'invalid decision';
  end if;

  select * into broker_row from public.brokers
  where auth_user_id = auth.uid() and active = true
  limit 1;
  if broker_row.id is null then raise exception 'broker profile missing'; end if;

  select * into req from public.consultation_requests
  where id = p_consultation_request_id
    and assigned_broker_id = broker_row.id
  for update;
  if req.id is null then raise exception 'request not assigned to this broker'; end if;

  if p_decision = 'accepted' then
    update public.consultation_requests
    set broker_acceptance = 'accepted',
        broker_accepted_at = now(),
        broker_declined_at = null,
        broker_decline_reason = null,
        updated_at = now()
    where id = req.id;
    insert into public.consultation_messages (
      consultation_request_id, sender_user_id, sender_role, message_kind, body
    ) values (
      req.id, auth.uid(), 'system', 'system', 'Il broker ha preso in carico la richiesta.'
    );
  else
    update public.consultation_requests
    set broker_acceptance = 'declined',
        broker_declined_at = now(),
        broker_decline_reason = nullif(trim(p_reason), ''),
        assigned_broker_id = null,
        updated_at = now()
    where id = req.id;
    insert into public.consultation_messages (
      consultation_request_id, sender_user_id, sender_role, message_kind, body
    ) values (
      req.id, auth.uid(), 'system', 'system', 'Il broker non è disponibile. ATLAS può riassegnare.'
    );
  end if;

  perform public.write_platform_audit(
    case when p_decision = 'accepted' then 'broker_assignment_accepted' else 'broker_assignment_declined' end,
    'consultation_request',
    req.id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

revoke all on function public.broker_respond_to_assignment(uuid, text, text) from public, anon;
grant execute on function public.broker_respond_to_assignment(uuid, text, text) to authenticated;

create or replace function public.review_intelligence_application(
  p_application_id uuid,
  p_decision text,
  p_admin_notes text default null,
  p_rejection_reason text default null,
  p_module_access text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_row public.intelligence_applications%rowtype;
  company_id uuid;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  if p_decision not in ('under_review', 'approve', 'reject', 'suspend') then
    raise exception 'invalid decision';
  end if;

  select * into app_row from public.intelligence_applications where id = p_application_id for update;
  if app_row.id is null then raise exception 'application not found'; end if;

  insert into public.intelligence_application_reviews (application_id, decision, admin_notes, reviewed_by)
  values (app_row.id, p_decision, p_admin_notes, auth.uid());

  if p_decision = 'under_review' then
    update public.intelligence_applications
    set status = 'under_review', updated_at = now()
    where id = app_row.id;
    return null;
  end if;

  if p_decision = 'reject' then
    update public.intelligence_applications
    set status = 'rejected',
        rejection_reason = coalesce(p_rejection_reason, 'Requisiti non soddisfatti'),
        updated_at = now()
    where id = app_row.id;
    return null;
  end if;

  if p_decision = 'approve' then
    insert into public.intelligence_companies (
      legal_name, display_name, company_type, website, country, market_scope, module_access
    ) values (
      coalesce(app_row.legal_entity, app_row.company_name),
      app_row.company_name,
      app_row.company_type,
      app_row.website,
      app_row.country,
      app_row.market_scope,
      coalesce(p_module_access, app_row.desired_modules, array['market_overview','switching','premium_benchmark','coverage_benchmark','geography','insurer_comparison'])
    )
    returning id into company_id;

    insert into public.intelligence_memberships (company_id, user_id, member_role, active)
    values (company_id, app_row.user_id, 'company_admin', true)
    on conflict (company_id, user_id) do update set active = true, member_role = 'company_admin';

    update public.intelligence_applications
    set status = 'approved', company_id = company_id, updated_at = now()
    where id = app_row.id;

    perform public.write_platform_audit(
      'intelligence_application_approved',
      'intelligence_application',
      app_row.id,
      jsonb_build_object('company_id', company_id)
    );
    return company_id;
  end if;

  if p_decision = 'suspend' and app_row.company_id is not null then
    update public.intelligence_companies set status = 'suspended', updated_at = now()
    where id = app_row.company_id;
    update public.intelligence_memberships set active = false where company_id = app_row.company_id;
  end if;
  return app_row.company_id;
end;
$$;

revoke all on function public.review_intelligence_application(uuid, text, text, text, text[]) from public, anon;
grant execute on function public.review_intelligence_application(uuid, text, text, text, text[]) to authenticated;

-- Privacy-safe aggregate reader: returns empty / masked when below threshold
create or replace function public.get_intelligence_market_overview(
  p_category text default null,
  p_canton text default null
)
returns table (
  category text,
  canton text,
  observed_policies integer,
  median_premium numeric,
  p25_premium numeric,
  p75_premium numeric,
  sample_status text,
  minimum_cohort_size integer,
  methodology_version text,
  calculated_at timestamptz,
  period_start date,
  period_end date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  min_k integer := 20;
begin
  if not public.has_atlas_intelligence() then
    raise exception 'intelligence access required';
  end if;

  return query
  select
    s.category,
    s.canton,
    case when s.source_count >= s.minimum_cohort_size and not s.privacy_masked
      then s.observed_policies else null end,
    case when s.source_count >= s.minimum_cohort_size and not s.privacy_masked
      then s.median_premium else null end,
    case when s.source_count >= s.minimum_cohort_size and not s.privacy_masked
      then s.p25_premium else null end,
    case when s.source_count >= s.minimum_cohort_size and not s.privacy_masked
      then s.p75_premium else null end,
    case
      when s.source_count >= s.minimum_cohort_size and not s.privacy_masked then 'ok'
      else 'insufficient_sample'
    end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at,
    s.period_start,
    s.period_end
  from public.intelligence_market_snapshot s
  where (p_category is null or s.category = p_category)
    and (p_canton is null or s.canton = p_canton)
  order by s.calculated_at desc
  limit 50;
end;
$$;

revoke all on function public.get_intelligence_market_overview(text, text) from public, anon;
grant execute on function public.get_intelligence_market_overview(text, text) to authenticated;

create or replace function public.get_intelligence_switching_matrix(
  p_category text default null
)
returns table (
  from_insurer text,
  to_insurer text,
  switch_count integer,
  sample_status text,
  minimum_cohort_size integer,
  methodology_version text,
  calculated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_atlas_intelligence() then
    raise exception 'intelligence access required';
  end if;

  return query
  select
    s.from_insurer,
    s.to_insurer,
    case when s.switch_count >= s.minimum_cohort_size and not s.privacy_masked
      then s.switch_count else null end,
    case
      when s.switch_count >= s.minimum_cohort_size and not s.privacy_masked then 'ok'
      else 'insufficient_sample'
    end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at
  from public.intelligence_switching_snapshot s
  where (p_category is null or s.category = p_category)
  order by s.calculated_at desc
  limit 200;
end;
$$;

revoke all on function public.get_intelligence_switching_matrix(text) from public, anon;
grant execute on function public.get_intelligence_switching_matrix(text) to authenticated;
