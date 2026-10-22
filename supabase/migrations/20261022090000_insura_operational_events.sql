create table if not exists public.insura_operational_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null check (event_type in ('upload_ok','upload_failed','analysis_ok','analysis_failed')),
 duration_ms integer not null check (duration_ms >= 0 and duration_ms <= 3600000),
 created_at timestamptz not null default now()
);
create index if not exists insura_operational_events_user_created on public.insura_operational_events(user_id,created_at desc);
alter table public.insura_operational_events enable row level security;
revoke all on public.insura_operational_events from anon;
grant select, insert on public.insura_operational_events to authenticated;
create policy "events_own_select" on public.insura_operational_events for select to authenticated using (user_id = (select auth.uid()));
create policy "events_own_insert" on public.insura_operational_events for insert to authenticated with check (user_id = (select auth.uid()));
