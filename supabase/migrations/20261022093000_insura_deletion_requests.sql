create table if not exists public.insura_deletion_requests (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
 requested_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.insura_deletion_requests enable row level security;
revoke all on public.insura_deletion_requests from anon;
grant select, insert on public.insura_deletion_requests to authenticated;
create policy "own_deletion_request_read" on public.insura_deletion_requests for select to authenticated using (user_id = (select auth.uid()));
create policy "own_deletion_request_create" on public.insura_deletion_requests for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
