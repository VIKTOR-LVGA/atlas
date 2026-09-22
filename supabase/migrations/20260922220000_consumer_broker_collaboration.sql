-- ATLAS Consumer ↔ Broker Collaboration 1.0
-- Additive / backward compatible.

-- Review reason on consultation
alter table public.consultation_requests
  add column if not exists review_reason text;

alter table public.consultation_requests
  add column if not exists review_reason_detail text;

-- Appointment status expansion (keep legacy 'scheduled' as confirmed synonym in app)
alter table public.consultation_appointments
  drop constraint if exists consultation_appointments_status_check;

alter table public.consultation_appointments
  add constraint consultation_appointments_status_check
  check (status in (
    'scheduled',
    'proposed',
    'counter_proposed',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  ));

alter table public.consultation_appointments
  drop constraint if exists consultation_appointments_channel_check;

alter table public.consultation_appointments
  add constraint consultation_appointments_channel_check
  check (channel in ('phone', 'video', 'in_person', 'other'));

-- Appointment history (do not silently overwrite)
create table if not exists public.consultation_appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.consultation_appointments(id) on delete cascade,
  consultation_request_id uuid not null references public.consultation_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null check (actor_role in ('consumer', 'broker', 'admin', 'system')),
  event_type text not null,
  scheduled_at timestamptz,
  duration_minutes integer,
  channel text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists consultation_appointment_events_appt_idx
  on public.consultation_appointment_events (appointment_id, created_at);

-- Message unread + internal flag (broker notes stay in broker_notes; this flags system/internal chat rows)
alter table public.consultation_messages
  add column if not exists read_at timestamptz;

alter table public.consultation_messages
  add column if not exists is_internal boolean not null default false;

grant update (read_at) on table public.consultation_messages to authenticated;

drop policy if exists consultation_messages_update_read on public.consultation_messages;
create policy consultation_messages_update_read on public.consultation_messages
  for update to authenticated
  using (
    exists (
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
                and b.active
            )
          )
        )
    )
  )
  with check (
    exists (
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
                and b.active
            )
          )
        )
    )
  );

-- Appointment proposal note
alter table public.consultation_appointments
  add column if not exists proposal_note text;

alter table public.consultation_appointments
  add column if not exists proposed_at timestamptz;

-- Offer comparison fields
alter table public.insurance_offers
  add column if not exists source_policy_id uuid references public.policies(id) on delete set null;

alter table public.insurance_offers
  add column if not exists quote_document_id uuid references public.documents(id) on delete set null;

alter table public.insurance_offers
  add column if not exists quote_validity_date date;

alter table public.insurance_offers
  add column if not exists effective_date date;

alter table public.insurance_offers
  add column if not exists currency text default 'CHF';

alter table public.insurance_offers
  add column if not exists consumer_visible_notes text;

alter table public.insurance_offers
  add column if not exists version integer not null default 1;

alter table public.insurance_offers
  add column if not exists viewed_at timestamptz;

alter table public.insurance_offers
  add column if not exists consumer_decision text;

alter table public.insurance_offers
  add column if not exists consumer_decision_at timestamptz;

alter table public.insurance_offers
  add column if not exists consumer_decision_note text;

-- Expand offer status carefully
alter table public.insurance_offers
  drop constraint if exists insurance_offers_status_check;

alter table public.insurance_offers
  add constraint insurance_offers_status_check
  check (status in (
    'draft',
    'proposed',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired',
    'clarification_requested',
    'interested',
    'declined',
    'converted'
  ));

-- Structured offer coverages / deductibles (optional detail rows)
create table if not exists public.insurance_offer_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.insurance_offers(id) on delete cascade,
  item_kind text not null check (item_kind in ('coverage', 'deductible', 'condition', 'limit')),
  code text,
  label text not null,
  value_text text,
  value_numeric numeric,
  currency text,
  created_at timestamptz not null default now()
);

create index if not exists insurance_offer_items_offer_idx
  on public.insurance_offer_items (offer_id);

-- Switch events (private; Intelligence aggregates later)
create table if not exists public.switch_events (
  id uuid primary key default gen_random_uuid(),
  consultation_request_id uuid references public.consultation_requests(id) on delete set null,
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  broker_id uuid references public.brokers(id) on delete set null,
  contract_id uuid references public.broker_contracts(id) on delete set null,
  offer_id uuid references public.insurance_offers(id) on delete set null,
  category text,
  from_insurer text,
  to_insurer text,
  old_premium numeric,
  new_premium numeric,
  reason_code text,
  source text not null default 'broker_confirmed'
    check (source in ('broker_confirmed', 'consumer_confirmed', 'user_declared')),
  confirmed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists switch_events_consumer_idx on public.switch_events (consumer_user_id, confirmed_at desc);

-- Activity / unread notifications (lightweight)
create table if not exists public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consultation_request_id uuid references public.consultation_requests(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_activity_events_user_idx
  on public.user_activity_events (user_id, created_at desc);

-- RLS
alter table public.consultation_appointment_events enable row level security;
alter table public.insurance_offer_items enable row level security;
alter table public.switch_events enable row level security;
alter table public.user_activity_events enable row level security;

grant select, insert on table public.consultation_appointment_events to authenticated;
grant select, insert, update, delete on table public.insurance_offer_items to authenticated;
grant select, insert on table public.switch_events to authenticated;
grant select, insert, update on table public.user_activity_events to authenticated;

-- Appointment events: same access as parent consultation
drop policy if exists consultation_appointment_events_select on public.consultation_appointment_events;
create policy consultation_appointment_events_select on public.consultation_appointment_events
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_appointment_events.consultation_request_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and exists (
              select 1 from public.brokers b
              where b.id = cr.assigned_broker_id
                and b.auth_user_id = auth.uid()
                and b.active
            )
          )
        )
    )
  );

drop policy if exists consultation_appointment_events_insert on public.consultation_appointment_events;
create policy consultation_appointment_events_insert on public.consultation_appointment_events
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
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
                and b.active
            )
          )
        )
    )
  );

-- Offer items: via offer ownership
drop policy if exists insurance_offer_items_access on public.insurance_offer_items;
create policy insurance_offer_items_access on public.insurance_offer_items
  for all to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.insurance_offers o
      join public.consultation_requests cr on cr.id = o.consultation_request_id
      where o.id = insurance_offer_items.offer_id
        and (
          cr.user_id = auth.uid()
          or (
            public.current_user_role() = 'broker'
            and exists (
              select 1 from public.brokers b
              where b.id = o.broker_id and b.auth_user_id = auth.uid() and b.active
            )
          )
        )
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.insurance_offers o
      join public.consultation_requests cr on cr.id = o.consultation_request_id
      where o.id = offer_id
        and (
          public.current_user_role() = 'broker'
          and exists (
            select 1 from public.brokers b
            where b.id = o.broker_id and b.auth_user_id = auth.uid() and b.active
          )
        )
    )
  );

-- Switch events: consumer own + admin; broker of related consultation; never intelligence raw
drop policy if exists switch_events_select on public.switch_events;
create policy switch_events_select on public.switch_events
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or consumer_user_id = auth.uid()
    or (
      public.current_user_role() = 'broker'
      and exists (
        select 1 from public.brokers b
        where b.id = switch_events.broker_id
          and b.auth_user_id = auth.uid()
          and b.active
      )
    )
  );

drop policy if exists switch_events_insert on public.switch_events;
create policy switch_events_insert on public.switch_events
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or (
      public.current_user_role() = 'broker'
      and exists (
        select 1 from public.brokers b
        where b.id = broker_id and b.auth_user_id = auth.uid() and b.active
      )
    )
    or consumer_user_id = auth.uid()
  );

drop policy if exists user_activity_events_own on public.user_activity_events;
create policy user_activity_events_own on public.user_activity_events
  for all to authenticated
  using (user_id = auth.uid() or public.current_user_role() = 'admin')
  with check (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Allow consumers to update offers for decision/view on their consultation
-- (broker policies already cover broker writes via existing for all)
drop policy if exists insurance_offers_consumer_update on public.insurance_offers;
create policy insurance_offers_consumer_update on public.insurance_offers
  for update to authenticated
  using (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = auth.uid()
    )
  );

-- Consumers can update appointments on their consultation (counter/confirm)
drop policy if exists consultation_appointments_consumer_update on public.consultation_appointments;
create policy consultation_appointments_consumer_update on public.consultation_appointments
  for update to authenticated
  using (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.consultation_requests cr
      where cr.id = consultation_request_id and cr.user_id = auth.uid()
    )
  );

-- Helper: notify user
create or replace function public.notify_user_activity(
  p_user_id uuid,
  p_consultation_id uuid,
  p_event_type text,
  p_title text,
  p_body text default null,
  p_href text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_activity_events (
    user_id, consultation_request_id, event_type, title, body, href
  ) values (
    p_user_id, p_consultation_id, p_event_type, p_title, p_body, p_href
  );
end;
$$;

revoke all on function public.notify_user_activity(uuid, uuid, text, text, text, text) from public, anon;
grant execute on function public.notify_user_activity(uuid, uuid, text, text, text, text) to authenticated;
