-- Hibernate Broker collaboration data access at the database layer.
-- Additive / reversible: set atlas_runtime_flags.broker_portal = true to restore.
-- Does NOT drop broker tables, policies, or historical assigned_broker_id rows.

create table if not exists public.atlas_runtime_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.atlas_runtime_flags (key, enabled)
values ('broker_portal', false)
on conflict (key) do nothing;

alter table public.atlas_runtime_flags enable row level security;

revoke all on table public.atlas_runtime_flags from anon, authenticated;
grant select on table public.atlas_runtime_flags to authenticated;

drop policy if exists atlas_runtime_flags_read on public.atlas_runtime_flags;
create policy atlas_runtime_flags_read
  on public.atlas_runtime_flags for select to authenticated
  using (true);

-- Admin-only updates via security definer RPC (not direct table writes).
create or replace function public.is_broker_portal_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select f.enabled from public.atlas_runtime_flags f where f.key = 'broker_portal'),
    false
  );
$$;

revoke all on function public.is_broker_portal_enabled() from public, anon;
grant execute on function public.is_broker_portal_enabled() to authenticated;

create or replace function public.set_broker_portal_enabled(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  insert into public.atlas_runtime_flags (key, enabled, updated_at)
  values ('broker_portal', p_enabled, now())
  on conflict (key) do update
    set enabled = excluded.enabled,
        updated_at = now();
end;
$$;

revoke all on function public.set_broker_portal_enabled(boolean) from public, anon;
grant execute on function public.set_broker_portal_enabled(boolean) to authenticated;

-- Central gate: when portal is hibernated, brokers have no collaboration identity.
create or replace function public.current_broker_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not public.is_broker_portal_enabled() then null
    else (
      select b.id
      from public.brokers b
      where b.auth_user_id = auth.uid() and b.active
      limit 1
    )
  end;
$$;

-- RPCs that bypass current_broker_id via direct auth_user_id lookups.
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
  if not public.is_broker_portal_enabled() then
    raise exception 'broker portal disabled';
  end if;
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

-- Patch revoke_consultation_shares broker branch to respect portal flag.
create or replace function public.revoke_consultation_shares(p_consultation_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
  allowed boolean := false;
begin
  if public.current_user_role() = 'admin' then
    allowed := true;
  elsif public.current_user_role() = 'consumer' then
    allowed := exists (
      select 1 from public.consultation_requests
      where id = p_consultation_id and user_id = auth.uid()
    );
  elsif public.current_user_role() = 'broker' then
    allowed := public.is_broker_portal_enabled()
      and exists (
        select 1 from public.consultation_requests cr
        where cr.id = p_consultation_id
          and cr.assigned_broker_id = public.current_broker_id()
      );
  end if;

  if not allowed then
    raise exception 'Not authorized';
  end if;

  update public.consultation_shared_resources
  set revoked_at = now()
  where consultation_request_id = p_consultation_id
    and revoked_at is null;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.revoke_consultation_shares(uuid) from public, anon;
grant execute on function public.revoke_consultation_shares(uuid) to authenticated;

-- Identity RPCs must still resolve the broker row when the portal is hibernated
-- (role unchanged; collaboration gated separately via current_broker_id()).
create or replace function public.get_current_partner_profile()
returns table (
  id uuid, auth_user_id uuid, display_name text, legal_name text,
  organization_name text, email text, phone text, finma_reference text, active boolean,
  website text, partner_type text, primary_canton text, served_cantons text[],
  languages text[], professional_id text, experience_notes text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  return query select b.id, b.auth_user_id, b.display_name, b.legal_name,
    b.organization_name, b.email, b.phone, b.finma_reference, b.active,
    b.website, b.partner_type, b.primary_canton, b.served_cantons,
    b.languages, b.professional_id, b.experience_notes
  from public.brokers b
  where b.auth_user_id = auth.uid() and b.active
  limit 1;
end;
$$;

create or replace function public.get_current_broker_profile()
returns table (
  id uuid, auth_user_id uuid, display_name text, legal_name text,
  organization_name text, email text, phone text, finma_reference text, active boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'broker' then raise exception 'broker role required'; end if;
  return query select b.id, b.auth_user_id, b.display_name, b.legal_name,
    b.organization_name, b.email, b.phone, b.finma_reference, b.active
  from public.brokers b
  where b.auth_user_id = auth.uid() and b.active
  limit 1;
end;
$$;
