-- Append-only revenue attribution. Historical split amounts never recalculate.

create table public.commission_agreements (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete restrict,
  effective_from date not null,
  effective_to date,
  atlas_percentage numeric(7,4) not null,
  broker_percentage numeric(7,4) not null,
  scope text not null default 'global',
  category text,
  insurer text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_agreements_dates_check check (
    effective_to is null or effective_to >= effective_from
  ),
  constraint commission_agreements_percentages_check check (
    atlas_percentage between 0 and 100
    and broker_percentage between 0 and 100
    and atlas_percentage + broker_percentage = 100
  ),
  constraint commission_agreements_scope_check check (
    scope in ('global', 'category', 'insurer', 'category_insurer')
    and (scope not in ('category', 'category_insurer') or category is not null)
    and (scope not in ('insurer', 'category_insurer') or insurer is not null)
  )
);

create index commission_agreements_lookup_idx
  on public.commission_agreements (broker_id, effective_from desc, effective_to);

create table public.commission_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  consultation_request_id uuid not null references public.consultation_requests(id) on delete restrict,
  broker_id uuid not null references public.brokers(id) on delete restrict,
  broker_contract_id uuid references public.broker_contracts(id) on delete set null,
  policy_id uuid references public.policies(id) on delete set null,
  commission_agreement_id uuid not null references public.commission_agreements(id) on delete restrict,
  parent_commission_id uuid references public.commission_attributions(id) on delete restrict,
  insurer text not null,
  product text,
  category text not null,
  commission_type text not null,
  currency text not null default 'CHF',
  gross_commission numeric(14,2) not null,
  atlas_share numeric(14,2) not null,
  broker_share numeric(14,2) not null,
  other_share numeric(14,2) not null default 0,
  commission_rate numeric(9,4),
  earned_at timestamptz,
  paid_at timestamptz,
  status text not null default 'expected',
  source text not null default 'atlas',
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_attributions_type_check check (commission_type in (
    'acquisition', 'renewal', 'recurring', 'bonus', 'adjustment', 'clawback', 'other'
  )),
  constraint commission_attributions_status_check check (status in (
    'expected', 'earned', 'paid', 'partially_paid', 'reversed', 'cancelled'
  )),
  constraint commission_attributions_source_check check (source in ('atlas', 'imported', 'manual')),
  constraint commission_attributions_currency_check check (char_length(currency) = 3),
  constraint commission_attributions_amounts_check check (
    gross_commission >= 0 and atlas_share >= 0 and broker_share >= 0 and other_share >= 0
    and atlas_share + broker_share + other_share = gross_commission
  ),
  constraint commission_attributions_rate_check check (
    commission_rate is null or commission_rate between 0 and 100
  )
);

create index commission_attributions_user_idx
  on public.commission_attributions (user_id, created_at desc);
create index commission_attributions_broker_idx
  on public.commission_attributions (broker_id, created_at desc);
create index commission_attributions_parent_idx
  on public.commission_attributions (parent_commission_id)
  where parent_commission_id is not null;

create table public.commission_adjustments (
  id uuid primary key default gen_random_uuid(),
  commission_attribution_id uuid not null references public.commission_attributions(id) on delete restrict,
  adjustment_type text not null,
  amount numeric(14,2) not null,
  atlas_amount numeric(14,2) not null,
  broker_amount numeric(14,2) not null,
  other_amount numeric(14,2) not null default 0,
  reason text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint commission_adjustments_type_check check (
    adjustment_type in ('clawback', 'correction', 'bonus', 'manual_adjustment')
  ),
  constraint commission_adjustments_amount_check check (
    amount <> 0
    and atlas_amount + broker_amount + other_amount = amount
    and (adjustment_type <> 'clawback' or amount < 0)
    and (adjustment_type <> 'bonus' or amount > 0)
  ),
  constraint commission_adjustments_reason_check check (char_length(trim(reason)) between 1 and 2000)
);

create index commission_adjustments_attribution_idx
  on public.commission_adjustments (commission_attribution_id, occurred_at);

do $$
declare table_name text;
begin
  foreach table_name in array array['commission_agreements','commission_attributions','commission_adjustments']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

grant select, insert, update on table public.commission_agreements to authenticated;
grant select, insert, update on table public.commission_attributions to authenticated;
grant select, insert on table public.commission_adjustments to authenticated;

create policy "Admin manages commission agreements"
  on public.commission_agreements for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Broker reads own commission agreement"
  on public.commission_agreements for select to authenticated
  using (broker_id = (select public.current_broker_id()));

create policy "Admin manages commission attributions"
  on public.commission_attributions for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admin manages commission adjustments"
  on public.commission_adjustments for all to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create trigger commission_agreements_set_updated_at
  before update on public.commission_agreements
  for each row execute function public.set_row_updated_at();
create trigger commission_attributions_set_updated_at
  before update on public.commission_attributions
  for each row execute function public.set_row_updated_at();

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  if p_role not in ('consumer', 'broker', 'admin') then raise exception 'invalid role'; end if;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role)
  on conflict (user_id) do update set role = excluded.role;
end;
$$;

create or replace function public.create_commission_attribution(
  p_consultation_request_id uuid,
  p_broker_contract_id uuid,
  p_policy_id uuid,
  p_parent_commission_id uuid,
  p_insurer text,
  p_product text,
  p_category text,
  p_commission_type text,
  p_currency text,
  p_gross_commission numeric,
  p_commission_rate numeric,
  p_earned_at timestamptz,
  p_status text,
  p_source text,
  p_external_reference text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.consultation_requests%rowtype;
  agreement_row public.commission_agreements%rowtype;
  attribution_id uuid;
  atlas_amount numeric(14,2);
  broker_amount numeric(14,2);
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  if p_gross_commission < 0 then raise exception 'gross commission must be non-negative'; end if;

  select * into request_row from public.consultation_requests
  where id = p_consultation_request_id;
  if not found or request_row.assigned_broker_id is null then
    raise exception 'assigned consultation required';
  end if;

  select * into agreement_row
  from public.commission_agreements ca
  where ca.broker_id = request_row.assigned_broker_id
    and ca.effective_from <= coalesce(p_earned_at::date, current_date)
    and (ca.effective_to is null or ca.effective_to >= coalesce(p_earned_at::date, current_date))
    and (ca.scope = 'global'
      or (ca.scope = 'category' and ca.category = p_category)
      or (ca.scope = 'insurer' and lower(ca.insurer) = lower(p_insurer))
      or (ca.scope = 'category_insurer' and ca.category = p_category and lower(ca.insurer) = lower(p_insurer)))
  order by case ca.scope when 'category_insurer' then 4 when 'category' then 3 when 'insurer' then 2 else 1 end desc,
    ca.effective_from desc
  limit 1;
  if not found then raise exception 'active commission agreement not found'; end if;

  atlas_amount := round(p_gross_commission * agreement_row.atlas_percentage / 100, 2);
  broker_amount := p_gross_commission - atlas_amount;

  insert into public.commission_attributions (
    user_id, consultation_request_id, broker_id, broker_contract_id, policy_id,
    commission_agreement_id, parent_commission_id, insurer, product, category,
    commission_type, currency, gross_commission, atlas_share, broker_share,
    other_share, commission_rate, earned_at, paid_at, status, source, external_reference
  ) values (
    request_row.user_id, request_row.id, request_row.assigned_broker_id,
    p_broker_contract_id, p_policy_id, agreement_row.id, p_parent_commission_id,
    trim(p_insurer), nullif(trim(p_product), ''), p_category, p_commission_type,
    upper(p_currency), p_gross_commission, atlas_amount, broker_amount, 0,
    p_commission_rate, p_earned_at,
    case when p_status = 'paid' then coalesce(p_earned_at, now()) else null end,
    p_status, p_source, nullif(trim(p_external_reference), '')
  ) returning id into attribution_id;

  insert into public.consultation_events (
    consultation_request_id, event_type, actor_type, actor_id, metadata
  ) values (
    request_row.id, 'commission_created', 'admin', auth.uid(),
    jsonb_build_object('commission_id', attribution_id, 'gross', p_gross_commission,
      'atlas_share', atlas_amount, 'broker_share', broker_amount, 'currency', upper(p_currency))
  );
  return attribution_id;
end;
$$;

create or replace function public.create_commission_adjustment(
  p_commission_attribution_id uuid,
  p_adjustment_type text,
  p_amount numeric,
  p_reason text,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  commission_row public.commission_attributions%rowtype;
  adjustment_id uuid;
  atlas_amount_value numeric(14,2);
  other_amount_value numeric(14,2);
  broker_amount_value numeric(14,2);
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  select * into commission_row from public.commission_attributions
  where id = p_commission_attribution_id;
  if not found then raise exception 'commission not found'; end if;
  if p_adjustment_type = 'clawback' and p_amount >= 0 then
    raise exception 'clawback amount must be negative';
  end if;
  if commission_row.gross_commission = 0 then
    raise exception 'zero commission cannot be adjusted';
  end if;

  atlas_amount_value := round(p_amount * commission_row.atlas_share / nullif(commission_row.gross_commission, 0), 2);
  other_amount_value := round(p_amount * commission_row.other_share / nullif(commission_row.gross_commission, 0), 2);
  broker_amount_value := p_amount - atlas_amount_value - other_amount_value;

  insert into public.commission_adjustments (
    commission_attribution_id, adjustment_type, amount, atlas_amount,
    broker_amount, other_amount, reason, occurred_at
  ) values (
    commission_row.id, p_adjustment_type, p_amount, atlas_amount_value,
    broker_amount_value, other_amount_value, trim(p_reason), coalesce(p_occurred_at, now())
  ) returning id into adjustment_id;

  insert into public.consultation_events (
    consultation_request_id, event_type, actor_type, actor_id, metadata
  ) values (
    commission_row.consultation_request_id,
    case when p_adjustment_type = 'clawback' then 'commission_clawback' else 'commission_adjusted' end,
    'admin', auth.uid(),
    jsonb_build_object('commission_id', commission_row.id, 'adjustment_id', adjustment_id,
      'type', p_adjustment_type, 'amount', p_amount)
  );
  return adjustment_id;
end;
$$;

create or replace function public.get_admin_revenue_summary()
returns table (
  gross_commission numeric,
  atlas_revenue numeric,
  broker_revenue numeric,
  expected_commission numeric,
  paid_commission numeric,
  clawbacks numeric,
  net_commission numeric,
  contracts_count bigint,
  won_clients bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  return query
  with base as (
    select
      coalesce(sum(ca.gross_commission), 0) gross,
      coalesce(sum(ca.atlas_share), 0) atlas,
      coalesce(sum(ca.broker_share), 0) broker,
      coalesce(sum(ca.gross_commission) filter (where ca.status = 'expected'), 0) expected,
      coalesce(sum(ca.gross_commission) filter (where ca.status in ('paid','partially_paid')), 0) paid
    from public.commission_attributions ca
    where ca.status not in ('cancelled','reversed')
  ), adjustments as (
    select
      coalesce(sum(cadj.amount), 0) total,
      coalesce(sum(cadj.atlas_amount), 0) atlas,
      coalesce(sum(cadj.broker_amount), 0) broker,
      coalesce(sum(cadj.amount) filter (where cadj.adjustment_type = 'clawback'), 0) clawbacks
    from public.commission_adjustments cadj
  )
  select b.gross, b.atlas + a.atlas, b.broker + a.broker,
    b.expected, b.paid, a.clawbacks, b.gross + a.total,
    (select count(*) from public.broker_contracts),
    (select count(distinct user_id) from public.broker_contracts)
  from base b cross join adjustments a;
end;
$$;

create or replace function public.get_broker_revenue_summary()
returns table (
  broker_share numeric,
  expected_share numeric,
  paid_share numeric,
  clawback_share numeric,
  net_broker_revenue numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare broker_uuid uuid;
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  broker_uuid := public.current_broker_id();
  return query
  with base as (
    select coalesce(sum(ca.broker_share), 0) total,
      coalesce(sum(ca.broker_share) filter (where ca.status = 'expected'), 0) expected,
      coalesce(sum(ca.broker_share) filter (where ca.status in ('paid','partially_paid')), 0) paid
    from public.commission_attributions ca
    where ca.broker_id = broker_uuid and ca.status not in ('cancelled','reversed')
  ), adjustments as (
    select coalesce(sum(cadj.broker_amount), 0) total,
      coalesce(sum(cadj.broker_amount) filter (where cadj.adjustment_type = 'clawback'), 0) clawbacks
    from public.commission_adjustments cadj
    join public.commission_attributions ca on ca.id = cadj.commission_attribution_id
    where ca.broker_id = broker_uuid
  )
  select b.total, b.expected, b.paid, a.clawbacks, b.total + a.total
  from base b cross join adjustments a;
end;
$$;

create or replace function public.get_admin_revenue_breakdown(p_dimension text)
returns table (
  dimension_key text,
  gross_commission numeric,
  atlas_revenue numeric,
  broker_revenue numeric,
  adjustments numeric,
  net_commission numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  if p_dimension not in ('client','broker','insurer','category') then raise exception 'invalid dimension'; end if;
  return query
  select case p_dimension
      when 'client' then ca.user_id::text
      when 'broker' then ca.broker_id::text
      when 'insurer' then ca.insurer
      else ca.category
    end as key,
    sum(ca.gross_commission), sum(ca.atlas_share), sum(ca.broker_share),
    coalesce(sum(adj.amount), 0), sum(ca.gross_commission) + coalesce(sum(adj.amount), 0)
  from public.commission_attributions ca
  left join lateral (
    select sum(a.amount) amount from public.commission_adjustments a
    where a.commission_attribution_id = ca.id
  ) adj on true
  where ca.status not in ('cancelled','reversed')
  group by key
  order by sum(ca.gross_commission) + coalesce(sum(adj.amount), 0) desc;
end;
$$;

create or replace function public.get_broker_commission_ledger()
returns table (
  id uuid,
  consultation_request_id uuid,
  broker_contract_id uuid,
  parent_commission_id uuid,
  insurer text,
  product text,
  category text,
  commission_type text,
  currency text,
  broker_share numeric,
  status text,
  earned_at timestamptz,
  paid_at timestamptz,
  broker_adjustments numeric,
  net_broker_share numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare broker_uuid uuid;
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  broker_uuid := public.current_broker_id();
  return query
  select ca.id, ca.consultation_request_id, ca.broker_contract_id,
    ca.parent_commission_id, ca.insurer, ca.product, ca.category,
    ca.commission_type, ca.currency, ca.broker_share, ca.status,
    ca.earned_at, ca.paid_at, coalesce(sum(adj.broker_amount), 0),
    ca.broker_share + coalesce(sum(adj.broker_amount), 0)
  from public.commission_attributions ca
  left join public.commission_adjustments adj on adj.commission_attribution_id = ca.id
  where ca.broker_id = broker_uuid
  group by ca.id
  order by ca.created_at desc;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public, anon;
revoke all on function public.create_commission_attribution(uuid, uuid, uuid, uuid, text, text, text, text, text, numeric, numeric, timestamptz, text, text, text) from public, anon;
revoke all on function public.create_commission_adjustment(uuid, text, numeric, text, timestamptz) from public, anon;
revoke all on function public.get_admin_revenue_summary() from public, anon;
revoke all on function public.get_broker_revenue_summary() from public, anon;
revoke all on function public.get_admin_revenue_breakdown(text) from public, anon;
revoke all on function public.get_broker_commission_ledger() from public, anon;

grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.create_commission_attribution(uuid, uuid, uuid, uuid, text, text, text, text, text, numeric, numeric, timestamptz, text, text, text) to authenticated;
grant execute on function public.create_commission_adjustment(uuid, text, numeric, text, timestamptz) to authenticated;
grant execute on function public.get_admin_revenue_summary() to authenticated;
grant execute on function public.get_broker_revenue_summary() to authenticated;
grant execute on function public.get_admin_revenue_breakdown(text) to authenticated;
grant execute on function public.get_broker_commission_ledger() to authenticated;

create or replace function public.record_commission_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.consultation_events (
    consultation_request_id, event_type, actor_type, actor_id, metadata
  ) values (
    new.consultation_request_id,
    case when new.status = 'paid' then 'commission_paid' else 'commission_status_changed' end,
    'admin', auth.uid(),
    jsonb_build_object('commission_id', new.id, 'from_status', old.status,
      'to_status', new.status, 'paid_at', new.paid_at)
  );
  return new;
end;
$$;

create trigger commission_attributions_record_status
  after update of status, paid_at on public.commission_attributions
  for each row
  when (old.status is distinct from new.status or old.paid_at is distinct from new.paid_at)
  execute function public.record_commission_status_event();

revoke execute on function public.record_commission_status_event()
  from public, anon, authenticated;
