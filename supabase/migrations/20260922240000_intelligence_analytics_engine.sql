-- ATLAS Intelligence 1.0 — privacy-safe analytics engine
-- Private facts + extended snapshots + idempotent refresh + RPCs.
-- Additive / backward compatible. No fake data seeded.

-- ---------------------------------------------------------------------------
-- Central config
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_settings (
  key text primary key,
  value_int integer,
  value_text text,
  updated_at timestamptz not null default now()
);

insert into public.intelligence_settings (key, value_int)
values ('min_cohort_size', 20)
on conflict (key) do nothing;

insert into public.intelligence_settings (key, value_text)
values ('methodology_version', 'atlas-intelligence-v1')
on conflict (key) do nothing;

create or replace function public.intelligence_min_cohort_size()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select value_int from public.intelligence_settings where key = 'min_cohort_size'),
    20
  );
$$;

create or replace function public.intelligence_methodology_version()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select value_text from public.intelligence_settings where key = 'methodology_version'),
    'atlas-intelligence-v1'
  );
$$;

revoke all on function public.intelligence_min_cohort_size() from public, anon;
revoke all on function public.intelligence_methodology_version() from public, anon;
grant execute on function public.intelligence_min_cohort_size() to authenticated;
grant execute on function public.intelligence_methodology_version() to authenticated;

-- ---------------------------------------------------------------------------
-- Private analytical facts (NO grant to authenticated)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_policy_fact (
  id uuid primary key default gen_random_uuid(),
  source_policy_id uuid not null unique,
  category text not null,
  insurer_id text,
  insurer_label text,
  annualized_premium numeric,
  premium_frequency text,
  currency text,
  coverage_signature text[] not null default '{}',
  deductible_signature text,
  canton text,
  age_band text,
  eligible_premium boolean not null default false,
  eligible_coverage boolean not null default false,
  source_quality text not null default 'policy',
  observed_on date not null default (timezone('Europe/Zurich', now()))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analytics_policy_fact_cat_idx
  on public.analytics_policy_fact (category, observed_on);
create index if not exists analytics_policy_fact_insurer_idx
  on public.analytics_policy_fact (insurer_id, category);

create table if not exists public.analytics_quote_fact (
  id uuid primary key default gen_random_uuid(),
  source_offer_id uuid not null unique,
  category text not null,
  insurer_id text,
  insurer_label text,
  annualized_premium numeric,
  currency text,
  coverage_signature text[] not null default '{}',
  canton text,
  age_band text,
  verified boolean not null default false,
  observed_on date not null default (timezone('Europe/Zurich', now()))::date,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_contract_fact (
  id uuid primary key default gen_random_uuid(),
  source_contract_id uuid not null unique,
  category text not null,
  insurer_id text,
  insurer_label text,
  annualized_premium numeric,
  currency text,
  observed_on date not null default (timezone('Europe/Zurich', now()))::date,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_switch_fact (
  id uuid primary key default gen_random_uuid(),
  source_switch_id uuid not null unique,
  category text,
  from_insurer text,
  to_insurer text,
  old_annual_premium numeric,
  new_annual_premium numeric,
  premium_delta numeric,
  reason_code text,
  confirmation_source text,
  canton text,
  age_band text,
  observed_on date not null default (timezone('Europe/Zurich', now()))::date,
  created_at timestamptz not null default now()
);

create index if not exists analytics_switch_fact_flow_idx
  on public.analytics_switch_fact (from_insurer, to_insurer, category);

alter table public.analytics_policy_fact enable row level security;
alter table public.analytics_quote_fact enable row level security;
alter table public.analytics_contract_fact enable row level security;
alter table public.analytics_switch_fact enable row level security;
-- No SELECT grants to authenticated — security definer only.

-- ---------------------------------------------------------------------------
-- Extended snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_premium_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'atlas-intelligence-v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  canton text,
  age_band text,
  insurer text,
  source_count integer not null default 0,
  median_premium numeric,
  p25_premium numeric,
  p75_premium numeric,
  privacy_masked boolean not null default true,
  unique (period_start, period_end, methodology_version, category, canton, age_band, insurer)
);

create table if not exists public.intelligence_insurer_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'atlas-intelligence-v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  insurer text not null,
  observed_policies integer not null default 0,
  observed_share_pct numeric,
  median_premium numeric,
  switch_inflow integer not null default 0,
  switch_outflow integer not null default 0,
  net_observed_switching integer not null default 0,
  source_count integer not null default 0,
  privacy_masked boolean not null default true,
  unique (period_start, period_end, methodology_version, category, insurer)
);

create table if not exists public.intelligence_geography_snapshot (
  id uuid primary key default gen_random_uuid(),
  calculated_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  methodology_version text not null default 'atlas-intelligence-v1',
  minimum_cohort_size integer not null default 20,
  category text not null,
  canton text not null,
  observed_policies integer not null default 0,
  median_premium numeric,
  switch_count integer not null default 0,
  source_count integer not null default 0,
  privacy_masked boolean not null default true,
  unique (period_start, period_end, methodology_version, category, canton)
);

create table if not exists public.intelligence_snapshot_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  methodology_version text not null,
  minimum_cohort_size integer not null,
  period_start date not null,
  period_end date not null,
  policies_scanned integer not null default 0,
  policies_eligible integer not null default 0,
  quotes_eligible integer not null default 0,
  contracts_eligible integer not null default 0,
  switches_eligible integer not null default 0,
  snapshots_written integer not null default 0,
  error_message text,
  trigger_source text not null default 'manual'
);

alter table public.intelligence_premium_snapshot enable row level security;
alter table public.intelligence_insurer_snapshot enable row level security;
alter table public.intelligence_geography_snapshot enable row level security;
alter table public.intelligence_snapshot_runs enable row level security;

grant select on table public.intelligence_premium_snapshot to authenticated;
grant select on table public.intelligence_insurer_snapshot to authenticated;
grant select on table public.intelligence_geography_snapshot to authenticated;
grant select on table public.intelligence_snapshot_runs to authenticated;

drop policy if exists intelligence_premium_select on public.intelligence_premium_snapshot;
create policy intelligence_premium_select on public.intelligence_premium_snapshot
  for select to authenticated using (public.has_atlas_intelligence());

drop policy if exists intelligence_insurer_select on public.intelligence_insurer_snapshot;
create policy intelligence_insurer_select on public.intelligence_insurer_snapshot
  for select to authenticated using (public.has_atlas_intelligence());

drop policy if exists intelligence_geography_select on public.intelligence_geography_snapshot;
create policy intelligence_geography_select on public.intelligence_geography_snapshot
  for select to authenticated using (public.has_atlas_intelligence());

drop policy if exists intelligence_runs_admin_select on public.intelligence_snapshot_runs;
create policy intelligence_runs_admin_select on public.intelligence_snapshot_runs
  for select to authenticated using (public.current_user_role() = 'admin');

-- Query audit (partner analytics activity)
create table if not exists public.intelligence_query_audit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.intelligence_companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  query_type text not null,
  filter_dims jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.intelligence_query_audit enable row level security;
grant insert on table public.intelligence_query_audit to authenticated;
grant select on table public.intelligence_query_audit to authenticated;

drop policy if exists intelligence_query_audit_insert on public.intelligence_query_audit;
create policy intelligence_query_audit_insert on public.intelligence_query_audit
  for insert to authenticated
  with check (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists intelligence_query_audit_admin on public.intelligence_query_audit;
create policy intelligence_query_audit_admin on public.intelligence_query_audit
  for select to authenticated using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.intelligence_annualize_premium(
  amount numeric,
  frequency text
)
returns numeric
language sql
immutable
as $$
  select case
    when amount is null or amount < 0 then null
    when lower(coalesce(frequency, 'annual')) in ('annual', 'yearly') then amount
    when lower(frequency) = 'monthly' then amount * 12
    when lower(frequency) = 'quarterly' then amount * 4
    when lower(frequency) in ('semiannual', 'semi_annual', 'semi-annual') then amount * 2
    else null
  end;
$$;

create or replace function public.intelligence_percentile(sorted numeric[], p numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  n integer;
  idx numeric;
  lo integer;
  hi integer;
begin
  n := coalesce(array_length(sorted, 1), 0);
  if n = 0 then return null; end if;
  if n = 1 then return sorted[1]; end if;
  idx := 1 + (p / 100.0) * (n - 1);
  lo := floor(idx)::integer;
  hi := ceil(idx)::integer;
  if lo = hi then return sorted[lo]; end if;
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
end;
$$;

create or replace function public.intelligence_age_band(birth_date date)
returns text
language sql
immutable
as $$
  select case
    when birth_date is null then null
    when extract(year from age(birth_date)) < 18 then null
    when extract(year from age(birth_date)) <= 24 then '18-24'
    when extract(year from age(birth_date)) <= 34 then '25-34'
    when extract(year from age(birth_date)) <= 44 then '35-44'
    when extract(year from age(birth_date)) <= 54 then '45-54'
    when extract(year from age(birth_date)) <= 64 then '55-64'
    else '65+'
  end;
$$;

create or replace function public.intelligence_has_module(p_module text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() = 'admin' then
    return true;
  end if;
  return exists (
    select 1
    from public.intelligence_memberships m
    join public.intelligence_companies c on c.id = m.company_id
    where m.user_id = auth.uid()
      and m.active = true
      and c.status = 'active'
      and p_module = any (c.module_access)
  );
end;
$$;

revoke all on function public.intelligence_has_module(text) from public, anon;
grant execute on function public.intelligence_has_module(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Idempotent snapshot refresh
-- ---------------------------------------------------------------------------
create or replace function public.refresh_intelligence_snapshots(
  p_trigger_source text default 'manual',
  p_period_days integer default 365
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid;
  min_k integer := public.intelligence_min_cohort_size();
  meth text := public.intelligence_methodology_version();
  p_start date := (timezone('Europe/Zurich', now()))::date - greatest(p_period_days, 30);
  p_end date := (timezone('Europe/Zurich', now()))::date;
  policies_scanned integer := 0;
  policies_eligible integer := 0;
  quotes_eligible integer := 0;
  contracts_eligible integer := 0;
  switches_eligible integer := 0;
  snapshots_written integer := 0;
  r record;
  premiums numeric[];
  n integer;
  med numeric;
  p25 numeric;
  p75 numeric;
  masked boolean;
begin
  if public.current_user_role() is distinct from 'admin'
     and coalesce(p_trigger_source, '') not in ('scheduler', 'system') then
    -- allow scheduled/system callers via service role (role may be null)
    if auth.uid() is not null and public.current_user_role() is distinct from 'admin' then
      raise exception 'admin required to refresh intelligence snapshots';
    end if;
  end if;

  insert into public.intelligence_snapshot_runs (
    status, methodology_version, minimum_cohort_size, period_start, period_end, trigger_source
  ) values (
    'running', meth, min_k, p_start, p_end, coalesce(p_trigger_source, 'manual')
  ) returning id into run_id;

  begin
    -- Rebuild private policy facts (idempotent upsert)
    insert into public.analytics_policy_fact (
      source_policy_id, category, insurer_label, annualized_premium, premium_frequency,
      currency, canton, eligible_premium, eligible_coverage, observed_on, updated_at
    )
    select
      p.id,
      coalesce(nullif(trim(p.policy_type), ''), 'other'),
      nullif(trim(p.provider), ''),
      public.intelligence_annualize_premium(p.premium_amount, p.premium_frequency),
      p.premium_frequency,
      coalesce(p.currency, 'CHF'),
      nullif(upper(left(trim(coalesce(
        p.details->>'canton_or_premium_region',
        p.details->>'canton',
        ''
      )), 2)), ''),
      (
        p.premium_amount is not null
        and p.premium_amount > 0
        and public.intelligence_annualize_premium(p.premium_amount, p.premium_frequency) is not null
        and coalesce(p.currency, 'CHF') = 'CHF'
        and coalesce(p.status, 'active') = 'active'
      ),
      true,
      coalesce(p.created_at::date, p_end),
      now()
    from public.policies p
    where coalesce(p.created_at::date, p_end) between p_start and p_end
    on conflict (source_policy_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      annualized_premium = excluded.annualized_premium,
      premium_frequency = excluded.premium_frequency,
      currency = excluded.currency,
      canton = excluded.canton,
      eligible_premium = excluded.eligible_premium,
      observed_on = excluded.observed_on,
      updated_at = now();

    select count(*) into policies_scanned from public.analytics_policy_fact
    where observed_on between p_start and p_end;
    select count(*) into policies_eligible from public.analytics_policy_fact
    where observed_on between p_start and p_end and eligible_premium;

    -- Quotes (verified offers)
    insert into public.analytics_quote_fact (
      source_offer_id, category, insurer_label, annualized_premium, currency, verified, observed_on
    )
    select
      o.id,
      coalesce(nullif(trim(o.policy_category), ''), 'other'),
      nullif(trim(o.insurer), ''),
      public.intelligence_annualize_premium(o.premium_amount, o.premium_frequency),
      coalesce(o.currency, 'CHF'),
      o.verified_at is not null,
      coalesce(o.proposed_at::date, o.created_at::date, p_end)
    from public.insurance_offers o
    where o.verified_at is not null
      and o.status in ('sent','proposed','viewed','interested','clarification_requested','accepted','converted')
      and coalesce(o.proposed_at::date, o.created_at::date, p_end) between p_start and p_end
    on conflict (source_offer_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      annualized_premium = excluded.annualized_premium,
      verified = excluded.verified,
      observed_on = excluded.observed_on;

    select count(*) into quotes_eligible from public.analytics_quote_fact
    where observed_on between p_start and p_end and verified;

    -- Contracts
    insert into public.analytics_contract_fact (
      source_contract_id, category, insurer_label, observed_on
    )
    select
      c.id,
      coalesce(nullif(trim(c.category), ''), 'other'),
      nullif(trim(c.insurer), ''),
      coalesce(c.contract_start_date, c.created_at::date, p_end)
    from public.broker_contracts c
    where coalesce(c.contract_start_date, c.created_at::date, p_end) between p_start and p_end
    on conflict (source_contract_id) do update set
      category = excluded.category,
      insurer_label = excluded.insurer_label,
      observed_on = excluded.observed_on;

    select count(*) into contracts_eligible from public.analytics_contract_fact
    where observed_on between p_start and p_end;

    -- Switches
    insert into public.analytics_switch_fact (
      source_switch_id, category, from_insurer, to_insurer,
      old_annual_premium, new_annual_premium, premium_delta,
      reason_code, confirmation_source, observed_on
    )
    select
      s.id,
      coalesce(nullif(trim(s.category), ''), 'other'),
      nullif(trim(s.from_insurer), ''),
      nullif(trim(s.to_insurer), ''),
      s.old_premium,
      s.new_premium,
      case when s.old_premium is not null and s.new_premium is not null
        then s.new_premium - s.old_premium else null end,
      s.reason_code,
      s.source,
      coalesce(s.confirmed_at::date, s.created_at::date, p_end)
    from public.switch_events s
    where coalesce(s.confirmed_at::date, s.created_at::date, p_end) between p_start and p_end
      and s.from_insurer is distinct from s.to_insurer
    on conflict (source_switch_id) do update set
      category = excluded.category,
      from_insurer = excluded.from_insurer,
      to_insurer = excluded.to_insurer,
      old_annual_premium = excluded.old_annual_premium,
      new_annual_premium = excluded.new_annual_premium,
      premium_delta = excluded.premium_delta,
      reason_code = excluded.reason_code,
      confirmation_source = excluded.confirmation_source,
      observed_on = excluded.observed_on;

    select count(*) into switches_eligible from public.analytics_switch_fact
    where observed_on between p_start and p_end;

    -- Clear current methodology period slices then rewrite (idempotent period replace)
    delete from public.intelligence_market_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_premium_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_switching_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_coverage_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_insurer_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;
    delete from public.intelligence_geography_snapshot
    where methodology_version = meth and period_start = p_start and period_end = p_end;

    -- Market / premium by category (all insurers) + by category×insurer
    for r in
      select
        f.category,
        null::text as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
      group by f.category
      union all
      select
        f.category,
        f.insurer_label as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
        and f.insurer_label is not null
      group by f.category, f.insurer_label
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      p25 := public.intelligence_percentile(premiums, 25);
      p75 := public.intelligence_percentile(premiums, 75);
      masked := n < min_k;

      insert into public.intelligence_market_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, age_band, insurer, observed_policies, median_premium, p25_premium, p75_premium,
        source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, null, r.insurer, r.n,
        case when masked then null else med end,
        case when masked then null else p25 end,
        case when masked then null else p75 end,
        n, masked
      );
      snapshots_written := snapshots_written + 1;

      insert into public.intelligence_premium_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, age_band, insurer, source_count, median_premium, p25_premium, p75_premium, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, null, r.insurer, n,
        case when masked then null else med end,
        case when masked then null else p25 end,
        case when masked then null else p75 end,
        masked
      );
      snapshots_written := snapshots_written + 1;
    end loop;

    -- Switching matrix (masked cells store 0 count + privacy_masked; RPC returns null)
    for r in
      select
        coalesce(s.category, 'other') as category,
        coalesce(s.from_insurer, 'unknown') as from_insurer,
        coalesce(s.to_insurer, 'unknown') as to_insurer,
        count(*)::integer as n
      from public.analytics_switch_fact s
      where s.observed_on between p_start and p_end
      group by 1, 2, 3
    loop
      masked := r.n < min_k;
      insert into public.intelligence_switching_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, from_insurer, to_insurer, switch_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, r.from_insurer, r.to_insurer,
        case when masked then 0 else r.n end,
        masked
      );
      snapshots_written := snapshots_written + 1;
    end loop;

    -- Coverage penetration (known status only)
    for r in
      select
        coalesce(pc.insurance_category, 'other') as category,
        coalesce(nullif(trim(pc.canonical_type), ''), 'unknown') as coverage_code,
        count(*) filter (where pc.coverage_status in ('included','excluded'))::integer as known_n,
        count(*) filter (where pc.coverage_status = 'included')::integer as included_n
      from public.policy_coverages pc
      where pc.created_at::date between p_start and p_end
      group by 1, 2
    loop
      masked := r.known_n < min_k;
      insert into public.intelligence_coverage_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, coverage_code, penetration_pct, source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, null, r.coverage_code,
        case when masked or r.known_n = 0 then null
          else round((r.included_n::numeric / r.known_n::numeric) * 100, 2) end,
        r.known_n,
        masked
      );
      snapshots_written := snapshots_written + 1;
    end loop;

    -- Geography (canton-level only)
    for r in
      select
        f.category,
        f.canton,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium and f.annualized_premium is not null) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
        and f.canton is not null
        and length(f.canton) = 2
      group by f.category, f.canton
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      masked := r.n < min_k;
      insert into public.intelligence_geography_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, canton, observed_policies, median_premium, switch_count, source_count, privacy_masked
      ) values (
        now(), p_start, p_end, meth, min_k,
        r.category, r.canton, r.n,
        case when masked then null else med end,
        coalesce((
          select count(*)::integer from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category, 'other') = r.category
            and s.canton = r.canton
        ), 0),
        r.n,
        masked
      );
      snapshots_written := snapshots_written + 1;
    end loop;

    -- Insurer snapshot
    for r in
      select
        f.category,
        coalesce(f.insurer_label, 'unknown') as insurer,
        count(*)::integer as n,
        array_agg(f.annualized_premium order by f.annualized_premium)
          filter (where f.eligible_premium) as prem
      from public.analytics_policy_fact f
      where f.observed_on between p_start and p_end
      group by f.category, coalesce(f.insurer_label, 'unknown')
    loop
      premiums := coalesce(r.prem, array[]::numeric[]);
      n := coalesce(array_length(premiums, 1), 0);
      med := public.intelligence_percentile(premiums, 50);
      masked := r.n < min_k;
      insert into public.intelligence_insurer_snapshot (
        calculated_at, period_start, period_end, methodology_version, minimum_cohort_size,
        category, insurer, observed_policies, observed_share_pct, median_premium,
        switch_inflow, switch_outflow, net_observed_switching, source_count, privacy_masked
      )
      select
        now(), p_start, p_end, meth, min_k,
        r.category, r.insurer, r.n,
        null,
        case when masked then null else med end,
        coalesce((select count(*) from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category,'other') = r.category
            and coalesce(s.to_insurer,'unknown') = r.insurer), 0),
        coalesce((select count(*) from public.analytics_switch_fact s
          where s.observed_on between p_start and p_end
            and coalesce(s.category,'other') = r.category
            and coalesce(s.from_insurer,'unknown') = r.insurer), 0),
        0,
        r.n,
        masked;
      update public.intelligence_insurer_snapshot
      set net_observed_switching = switch_inflow - switch_outflow
      where methodology_version = meth and period_start = p_start and period_end = p_end
        and category = r.category and insurer = r.insurer
        and calculated_at >= now() - interval '1 minute';
      snapshots_written := snapshots_written + 1;
    end loop;

    update public.intelligence_snapshot_runs
    set
      status = 'succeeded',
      finished_at = now(),
      policies_scanned = policies_scanned,
      policies_eligible = policies_eligible,
      quotes_eligible = quotes_eligible,
      contracts_eligible = contracts_eligible,
      switches_eligible = switches_eligible,
      snapshots_written = snapshots_written
    where id = run_id;

  exception when others then
    update public.intelligence_snapshot_runs
    set status = 'failed', finished_at = now(), error_message = left(SQLERRM, 500)
    where id = run_id;
    raise;
  end;

  return run_id;
end;
$$;

revoke all on function public.refresh_intelligence_snapshots(text, integer) from public, anon;
grant execute on function public.refresh_intelligence_snapshots(text, integer) to authenticated;

-- Dashboard summary RPC
create or replace function public.get_intelligence_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  min_k integer := public.intelligence_min_cohort_size();
  meth text := public.intelligence_methodology_version();
  last_run public.intelligence_snapshot_runs%rowtype;
  result jsonb;
begin
  if not public.has_atlas_intelligence() then
    raise exception 'intelligence access required';
  end if;

  select * into last_run
  from public.intelligence_snapshot_runs
  where status = 'succeeded'
  order by finished_at desc nulls last
  limit 1;

  result := jsonb_build_object(
    'sample_label', 'Campione ATLAS',
    'methodology_version', meth,
    'minimum_cohort_size', min_k,
    'last_updated', last_run.finished_at,
    'period_start', last_run.period_start,
    'period_end', last_run.period_end,
    'policies_eligible', last_run.policies_eligible,
    'quotes_eligible', last_run.quotes_eligible,
    'switches_eligible', last_run.switches_eligible,
    'contracts_eligible', last_run.contracts_eligible,
    'market_series_ok', (
      select count(*) from public.intelligence_market_snapshot s
      where s.methodology_version = meth and not s.privacy_masked and s.source_count >= min_k
    ),
    'switching_cells_ok', (
      select count(*) from public.intelligence_switching_snapshot s
      where s.methodology_version = meth and not s.privacy_masked and s.switch_count >= min_k
    ),
    'representativeness', 'I dati rappresentano il campione osservato da ATLAS, non necessariamente l''intero mercato svizzero.'
  );
  return result;
end;
$$;

revoke all on function public.get_intelligence_dashboard_summary() from public, anon;
grant execute on function public.get_intelligence_dashboard_summary() to authenticated;

-- Premium RPC with module gate
create or replace function public.get_intelligence_premiums(
  p_category text default null,
  p_canton text default null
)
returns table (
  category text,
  canton text,
  insurer text,
  source_count integer,
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
begin
  if not public.has_atlas_intelligence() then
    raise exception 'intelligence access required';
  end if;
  if not public.intelligence_has_module('premium_benchmark') then
    raise exception 'module not entitled: premium_benchmark';
  end if;

  return query
  select
    s.category,
    s.canton,
    s.insurer,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.source_count else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.median_premium else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.p25_premium else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.p75_premium else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then 'ok' else 'insufficient_sample' end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at,
    s.period_start,
    s.period_end
  from public.intelligence_premium_snapshot s
  where (p_category is null or s.category = p_category)
    and (p_canton is null or s.canton = p_canton)
  order by s.calculated_at desc
  limit 100;
end;
$$;

revoke all on function public.get_intelligence_premiums(text, text) from public, anon;
grant execute on function public.get_intelligence_premiums(text, text) to authenticated;

create or replace function public.get_intelligence_coverages(p_category text default null)
returns table (
  category text,
  coverage_code text,
  penetration_pct numeric,
  source_count integer,
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
  if not public.intelligence_has_module('coverage_benchmark') then
    raise exception 'module not entitled: coverage_benchmark';
  end if;

  return query
  select
    s.category,
    s.coverage_code,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.penetration_pct else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.source_count else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then 'ok' else 'insufficient_sample' end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at
  from public.intelligence_coverage_snapshot s
  where (p_category is null or s.category = p_category)
  order by s.calculated_at desc
  limit 200;
end;
$$;

revoke all on function public.get_intelligence_coverages(text) from public, anon;
grant execute on function public.get_intelligence_coverages(text) to authenticated;

create or replace function public.get_intelligence_geography(p_category text default null)
returns table (
  category text,
  canton text,
  observed_policies integer,
  median_premium numeric,
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
  if not public.intelligence_has_module('geography') then
    raise exception 'module not entitled: geography';
  end if;

  return query
  select
    s.category,
    s.canton,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.observed_policies else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.median_premium else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.switch_count else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then 'ok' else 'insufficient_sample' end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at
  from public.intelligence_geography_snapshot s
  where (p_category is null or s.category = p_category)
  order by s.calculated_at desc
  limit 100;
end;
$$;

revoke all on function public.get_intelligence_geography(text) from public, anon;
grant execute on function public.get_intelligence_geography(text) to authenticated;

create or replace function public.get_intelligence_insurers(p_category text default null)
returns table (
  category text,
  insurer text,
  observed_policies integer,
  median_premium numeric,
  switch_inflow integer,
  switch_outflow integer,
  net_observed_switching integer,
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
  if not public.intelligence_has_module('insurer_comparison') then
    raise exception 'module not entitled: insurer_comparison';
  end if;

  return query
  select
    s.category,
    s.insurer,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.observed_policies else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.median_premium else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.switch_inflow else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.switch_outflow else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then s.net_observed_switching else null end,
    case when not s.privacy_masked and s.source_count >= s.minimum_cohort_size then 'ok' else 'insufficient_sample' end,
    s.minimum_cohort_size,
    s.methodology_version,
    s.calculated_at
  from public.intelligence_insurer_snapshot s
  where (p_category is null or s.category = p_category)
  order by s.calculated_at desc
  limit 100;
end;
$$;

revoke all on function public.get_intelligence_insurers(text) from public, anon;
grant execute on function public.get_intelligence_insurers(text) to authenticated;

-- Harden existing switching RPC with module check
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
  if not public.intelligence_has_module('switching') then
    raise exception 'module not entitled: switching';
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

-- Admin health
create or replace function public.get_intelligence_data_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_run public.intelligence_snapshot_runs%rowtype;
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'admin required';
  end if;
  select * into last_run from public.intelligence_snapshot_runs
  order by started_at desc limit 1;
  return jsonb_build_object(
    'min_cohort_size', public.intelligence_min_cohort_size(),
    'methodology_version', public.intelligence_methodology_version(),
    'last_run', to_jsonb(last_run),
    'policy_facts', (select count(*) from public.analytics_policy_fact),
    'quote_facts', (select count(*) from public.analytics_quote_fact),
    'contract_facts', (select count(*) from public.analytics_contract_fact),
    'switch_facts', (select count(*) from public.analytics_switch_fact),
    'market_snapshots', (select count(*) from public.intelligence_market_snapshot),
    'switching_snapshots', (select count(*) from public.intelligence_switching_snapshot)
  );
end;
$$;

revoke all on function public.get_intelligence_data_health() from public, anon;
grant execute on function public.get_intelligence_data_health() to authenticated;

-- Harden market overview with module entitlement + centralized k
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
begin
  if not public.has_atlas_intelligence() then
    raise exception 'intelligence access required';
  end if;
  if not public.intelligence_has_module('market_overview') then
    raise exception 'module not entitled: market_overview';
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
