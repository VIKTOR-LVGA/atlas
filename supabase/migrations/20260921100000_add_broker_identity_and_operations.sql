-- ATLAS broker identity, explicit sharing and operational pipeline.

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'consumer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_role_check check (role in ('consumer', 'broker', 'admin'))
);

insert into public.user_roles (user_id, role)
select id, 'consumer' from auth.users
on conflict (user_id) do nothing;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select ur.role from public.user_roles ur where ur.user_id = auth.uid()),
    'consumer'
  );
$$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'consumer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_create_role
  after insert on auth.users
  for each row execute function public.handle_new_auth_user_role();

revoke execute on function public.handle_new_auth_user_role()
  from public, anon, authenticated;

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

create policy "Users read own role and admins read roles"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_user_role()) = 'admin');

create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row execute function public.set_row_updated_at();

alter table public.brokers
  add column auth_user_id uuid unique references auth.users(id) on delete set null,
  add column organization_name text,
  add column finma_reference text;

create index brokers_auth_user_id_idx on public.brokers (auth_user_id)
  where auth_user_id is not null;

create or replace function public.current_broker_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select b.id
  from public.brokers b
  where b.auth_user_id = auth.uid() and b.active
  limit 1;
$$;

revoke all on function public.current_broker_id() from public, anon;
grant execute on function public.current_broker_id() to authenticated;

grant insert, update, delete on table public.brokers to authenticated;

create policy "Broker reads own profile and admin manages brokers"
  on public.brokers for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
  );

create policy "Admin creates brokers"
  on public.brokers for insert to authenticated
  with check ((select public.current_user_role()) = 'admin');

create policy "Admin updates brokers"
  on public.brokers for update to authenticated
  using ((select public.current_user_role()) = 'admin')
  with check ((select public.current_user_role()) = 'admin');

create policy "Admin deletes brokers"
  on public.brokers for delete to authenticated
  using ((select public.current_user_role()) = 'admin');

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
  from public.brokers b where b.id = public.current_broker_id();
end;
$$;

create or replace function public.get_admin_brokers()
returns setof public.brokers
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_user_role() <> 'admin' then raise exception 'admin role required'; end if;
  return query select b.* from public.brokers b order by b.display_name;
end;
$$;

revoke all on function public.get_current_broker_profile() from public, anon;
revoke all on function public.get_admin_brokers() from public, anon;
grant execute on function public.get_current_broker_profile() to authenticated;
grant execute on function public.get_admin_brokers() to authenticated;

alter table public.consultation_requests
  add column source text not null default 'atlas';

alter table public.consultation_requests
  drop constraint consultation_requests_status_check,
  add constraint consultation_requests_status_check check (status in (
    'submitted', 'assigned', 'contacted', 'consultation_scheduled',
    'in_review', 'quoted', 'won', 'lost', 'completed', 'cancelled'
  )),
  add constraint consultation_requests_source_check check (source in ('atlas', 'imported'));

grant select on table public.consultation_requests to authenticated;

create policy "Assigned broker and admin read consultations"
  on public.consultation_requests for select to authenticated
  using (
    assigned_broker_id = (select public.current_broker_id())
    or (select public.current_user_role()) = 'admin'
  );

create policy "Assigned broker reads consumer profile"
  on public.profiles for select to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or exists (
      select 1 from public.consultation_requests cr
      where cr.user_id = profiles.id
        and cr.assigned_broker_id = (select public.current_broker_id())
    )
  );

create table public.consultation_shared_resources (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  shared_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consultation_shared_resources_type_check check (
    resource_type in ('policy', 'document', 'vehicle', 'property', 'family_member')
  ),
  constraint consultation_shared_resources_dates_check
    check (revoked_at is null or revoked_at >= shared_at),
  constraint consultation_shared_resources_unique
    unique (consultation_request_id, resource_type, resource_id)
);

create index consultation_shared_resources_request_idx
  on public.consultation_shared_resources (consultation_request_id, resource_type)
  where revoked_at is null;

alter table public.consultation_shared_resources enable row level security;
revoke all on table public.consultation_shared_resources from anon, authenticated;
grant select, insert, update (revoked_at) on table public.consultation_shared_resources to authenticated;

create or replace function public.current_user_owns_consultation_resource(
  p_resource_type text,
  p_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_resource_type
    when 'policy' then exists (
      select 1 from public.policies p where p.id = p_resource_id and p.user_id = auth.uid()
    )
    when 'document' then exists (
      select 1 from public.documents d where d.id = p_resource_id and d.user_id = auth.uid()
    )
    when 'vehicle' then exists (
      select 1 from public.vehicles v where v.id = p_resource_id and v.user_id = auth.uid()
    )
    when 'property' then exists (
      select 1 from public.properties pr where pr.id = p_resource_id and pr.user_id = auth.uid()
    )
    when 'family_member' then exists (
      select 1 from public.family_members fm where fm.id = p_resource_id and fm.user_id = auth.uid()
    )
    else false
  end;
$$;

revoke all on function public.current_user_owns_consultation_resource(text, uuid) from public, anon;
grant execute on function public.current_user_owns_consultation_resource(text, uuid) to authenticated;

create policy "Consumer shares owned consultation resources"
  on public.consultation_shared_resources for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = (select auth.uid())
    )
    and public.current_user_owns_consultation_resource(resource_type, resource_id)
  );

create policy "Consumer reads and revokes own shared resources"
  on public.consultation_shared_resources for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.current_user_role()) = 'admin'
    or exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and cr.assigned_broker_id = (select public.current_broker_id())
    )
  );

create policy "Consumer revokes own shared resources"
  on public.consultation_shared_resources for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and revoked_at is not null);

create policy "Broker reads explicitly shared policies"
  on public.policies for select to authenticated
  using (exists (
    select 1
    from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.resource_type = 'policy'
      and csr.resource_id = policies.id
      and csr.revoked_at is null
      and cr.assigned_broker_id = (select public.current_broker_id())
  ));

create policy "Broker reads explicitly shared documents"
  on public.documents for select to authenticated
  using (exists (
    select 1
    from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.resource_type = 'document'
      and csr.resource_id = documents.id
      and csr.revoked_at is null
      and cr.assigned_broker_id = (select public.current_broker_id())
  ));

create policy "Broker reads explicitly shared vehicles"
  on public.vehicles for select to authenticated
  using (exists (
    select 1 from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.resource_type = 'vehicle' and csr.resource_id = vehicles.id
      and csr.revoked_at is null
      and cr.assigned_broker_id = (select public.current_broker_id())
  ));

create policy "Broker reads explicitly shared properties"
  on public.properties for select to authenticated
  using (exists (
    select 1 from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.resource_type = 'property' and csr.resource_id = properties.id
      and csr.revoked_at is null
      and cr.assigned_broker_id = (select public.current_broker_id())
  ));

create policy "Broker reads explicitly shared family members"
  on public.family_members for select to authenticated
  using (exists (
    select 1 from public.consultation_shared_resources csr
    join public.consultation_requests cr on cr.id = csr.consultation_request_id
    where csr.resource_type = 'family_member' and csr.resource_id = family_members.id
      and csr.revoked_at is null
      and cr.assigned_broker_id = (select public.current_broker_id())
  ));

create policy "Broker downloads explicitly shared documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'policy-documents'
    and exists (
      select 1 from public.documents d
      join public.consultation_shared_resources csr
        on csr.resource_type = 'document' and csr.resource_id = d.id
      join public.consultation_requests cr on cr.id = csr.consultation_request_id
      where d.file_path = storage.objects.name
        and csr.revoked_at is null
        and cr.assigned_broker_id = (select public.current_broker_id())
    )
  );

create table public.broker_notes (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  broker_id uuid not null references public.brokers(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_notes_content_check check (char_length(trim(content)) between 1 and 8000)
);

create index broker_notes_request_created_idx
  on public.broker_notes (consultation_request_id, created_at desc);

create table public.consultation_appointments (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  broker_id uuid not null references public.brokers(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer,
  channel text not null,
  location_or_link text,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consultation_appointments_duration_check
    check (duration_minutes is null or duration_minutes between 5 and 480),
  constraint consultation_appointments_channel_check
    check (channel in ('phone', 'video', 'in_person')),
  constraint consultation_appointments_status_check
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show'))
);

create index consultation_appointments_request_idx
  on public.consultation_appointments (consultation_request_id, scheduled_at desc);

create table public.insurance_offers (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  broker_id uuid not null references public.brokers(id) on delete cascade,
  insurer text not null,
  product text not null,
  policy_category text not null,
  premium_amount numeric(14,2),
  premium_frequency text,
  status text not null default 'draft',
  proposed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insurance_offers_premium_check check (premium_amount is null or premium_amount >= 0),
  constraint insurance_offers_frequency_check check (
    premium_frequency is null or premium_frequency in ('monthly', 'quarterly', 'semiannual', 'annual')
  ),
  constraint insurance_offers_status_check check (
    status in ('draft', 'proposed', 'accepted', 'rejected', 'expired')
  ),
  constraint insurance_offers_metadata_check check (
    jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768
  )
);

create index insurance_offers_request_idx
  on public.insurance_offers (consultation_request_id, created_at desc);

create table public.broker_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consultation_request_id uuid not null references public.consultation_requests(id) on delete restrict,
  broker_id uuid not null references public.brokers(id) on delete restrict,
  insurance_offer_id uuid references public.insurance_offers(id) on delete set null,
  insurer text not null,
  product text not null,
  category text not null,
  external_policy_number text,
  contract_start_date date not null,
  contract_end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint broker_contracts_status_check check (status in ('active', 'cancelled', 'expired')),
  constraint broker_contracts_dates_check check (
    contract_end_date is null or contract_end_date >= contract_start_date
  )
);

create index broker_contracts_user_idx on public.broker_contracts (user_id, created_at desc);
create index broker_contracts_broker_idx on public.broker_contracts (broker_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['broker_notes','consultation_appointments','insurance_offers','broker_contracts']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

grant select, insert, update, delete on table public.broker_notes to authenticated;
grant select, insert, update on table public.consultation_appointments to authenticated;
grant select, insert, update on table public.insurance_offers to authenticated;
grant select, insert, update on table public.broker_contracts to authenticated;

create policy "Assigned broker owns notes"
  on public.broker_notes for all to authenticated
  using (
    broker_id = (select public.current_broker_id())
    and exists (select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id)
  )
  with check (
    broker_id = (select public.current_broker_id())
    and exists (select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id)
  );

create policy "Admin reads notes"
  on public.broker_notes for select to authenticated
  using ((select public.current_user_role()) = 'admin');

create policy "Assigned broker and admin manage appointments"
  on public.consultation_appointments for all to authenticated
  using (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id))
    or (select public.current_user_role()) = 'admin'
  )
  with check (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id))
    or (select public.current_user_role()) = 'admin'
  );

create policy "Assigned broker and admin manage offers"
  on public.insurance_offers for all to authenticated
  using (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id))
    or (select public.current_user_role()) = 'admin'
  )
  with check (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id))
    or (select public.current_user_role()) = 'admin'
  );

create policy "Assigned broker and admin manage contracts"
  on public.broker_contracts for all to authenticated
  using (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id))
    or (select public.current_user_role()) = 'admin'
  )
  with check (
    (broker_id = (select public.current_broker_id())
      and exists (select 1 from public.consultation_requests cr
        where cr.id = consultation_request_id and cr.assigned_broker_id = broker_id
          and cr.user_id = broker_contracts.user_id))
    or (select public.current_user_role()) = 'admin'
  );

create policy "Consumer reads own broker contracts"
  on public.broker_contracts for select to authenticated
  using (user_id = (select auth.uid()));

create trigger broker_notes_set_updated_at before update on public.broker_notes
  for each row execute function public.set_row_updated_at();
create trigger consultation_appointments_set_updated_at before update on public.consultation_appointments
  for each row execute function public.set_row_updated_at();
create trigger insurance_offers_set_updated_at before update on public.insurance_offers
  for each row execute function public.set_row_updated_at();
create trigger broker_contracts_set_updated_at before update on public.broker_contracts
  for each row execute function public.set_row_updated_at();

grant select on table public.broker_assignments to authenticated;
create policy "Broker reads own assignments and admin manages assignments"
  on public.broker_assignments for select to authenticated
  using (
    broker_id = (select public.current_broker_id())
    or (select public.current_user_role()) = 'admin'
  );

grant select on table public.consultation_events to authenticated;
create policy "Broker and admin read consultation events"
  on public.consultation_events for select to authenticated
  using (
    (select public.current_user_role()) = 'admin'
    or exists (select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id
        and cr.assigned_broker_id = (select public.current_broker_id()))
  );

create or replace function public.assign_consultation(
  p_consultation_request_id uuid,
  p_broker_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_broker uuid;
  new_assignment_id uuid;
  old_status text;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'admin role required';
  end if;
  if p_broker_id is not null and not exists (
    select 1 from public.brokers b where b.id = p_broker_id and b.active
  ) then
    raise exception 'active broker not found';
  end if;
  select assigned_broker_id, status into old_broker, old_status
  from public.consultation_requests where id = p_consultation_request_id for update;
  if not found then raise exception 'consultation not found'; end if;

  update public.broker_assignments
  set unassigned_at = now()
  where consultation_request_id = p_consultation_request_id and unassigned_at is null;

  if p_broker_id is not null then
    insert into public.broker_assignments (
      consultation_request_id, broker_id, assignment_reason
    ) values (p_consultation_request_id, p_broker_id, nullif(trim(p_reason), ''))
    returning id into new_assignment_id;
  end if;

  update public.consultation_requests
  set assigned_broker_id = p_broker_id,
      status = case
        when p_broker_id is not null and status = 'submitted' then 'assigned'
        when p_broker_id is null and status = 'assigned' then 'submitted'
        else status
      end
  where id = p_consultation_request_id;

  insert into public.consultation_events (
    consultation_request_id, event_type, from_status, to_status,
    actor_type, actor_id, metadata
  ) values (
    p_consultation_request_id,
    case when p_broker_id is null then 'broker_unassigned'
         when old_broker is null then 'broker_assigned' else 'broker_reassigned' end,
    old_status,
    case when p_broker_id is null and old_status = 'assigned' then 'submitted'
         when p_broker_id is not null and old_status = 'submitted' then 'assigned'
         else old_status end,
    'admin', auth.uid(),
    jsonb_build_object('from_broker_id', old_broker, 'to_broker_id', p_broker_id, 'reason', p_reason)
  );
  return new_assignment_id;
end;
$$;

create or replace function public.transition_consultation_status(
  p_consultation_request_id uuid,
  p_to_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_status text;
  assigned_broker uuid;
  actor_kind text;
begin
  select status, assigned_broker_id into old_status, assigned_broker
  from public.consultation_requests where id = p_consultation_request_id for update;
  if not found then raise exception 'consultation not found'; end if;
  if public.current_user_role() = 'broker' then
    if assigned_broker is distinct from public.current_broker_id() then
      raise exception 'consultation not assigned to broker';
    end if;
    actor_kind := 'broker';
  elsif public.current_user_role() = 'admin' then
    actor_kind := 'admin';
  else
    raise exception 'broker or admin role required';
  end if;

  if not (
    (old_status = 'assigned' and p_to_status in ('contacted', 'lost', 'cancelled')) or
    (old_status = 'contacted' and p_to_status in ('consultation_scheduled', 'lost', 'cancelled')) or
    (old_status = 'consultation_scheduled' and p_to_status in ('in_review', 'lost', 'cancelled')) or
    (old_status = 'in_review' and p_to_status in ('quoted', 'lost', 'completed')) or
    (old_status = 'quoted' and p_to_status in ('won', 'lost', 'in_review'))
  ) then
    raise exception 'invalid consultation status transition: % -> %', old_status, p_to_status;
  end if;

  update public.consultation_requests
  set status = p_to_status,
      closed_at = case when p_to_status in ('won','lost','completed','cancelled') then now() else null end
  where id = p_consultation_request_id;

  insert into public.consultation_events (
    consultation_request_id, event_type, from_status, to_status, actor_type, actor_id
  ) values (
    p_consultation_request_id, 'status_changed', old_status, p_to_status, actor_kind, auth.uid()
  );
  return p_to_status;
end;
$$;

revoke all on function public.assign_consultation(uuid, uuid, text) from public, anon;
revoke all on function public.transition_consultation_status(uuid, text) from public, anon;
grant execute on function public.assign_consultation(uuid, uuid, text) to authenticated;
grant execute on function public.transition_consultation_status(uuid, text) to authenticated;

create or replace function public.record_broker_operation_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
  kind text;
begin
  request_id := new.consultation_request_id;
  kind := case tg_table_name
    when 'consultation_appointments' then 'appointment_' || lower(new.status)
    when 'insurance_offers' then 'offer_' || lower(new.status)
    when 'broker_contracts' then 'contract_' || lower(new.status)
    else 'broker_operation'
  end;
  insert into public.consultation_events (
    consultation_request_id, event_type, actor_type, actor_id, metadata
  ) values (
    request_id, kind,
    case when public.current_user_role() = 'admin' then 'admin' else 'broker' end,
    auth.uid(), jsonb_build_object('table', tg_table_name, 'record_id', new.id)
  );
  return new;
end;
$$;

create trigger consultation_appointments_record_event
  after insert or update of status on public.consultation_appointments
  for each row execute function public.record_broker_operation_event();
create trigger insurance_offers_record_event
  after insert or update of status on public.insurance_offers
  for each row execute function public.record_broker_operation_event();
create trigger broker_contracts_record_event
  after insert or update of status on public.broker_contracts
  for each row execute function public.record_broker_operation_event();

revoke execute on function public.record_broker_operation_event()
  from public, anon, authenticated;
