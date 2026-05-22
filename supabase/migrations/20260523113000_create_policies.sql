create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  provider text not null,
  policy_type text not null,
  premium_amount numeric,
  premium_frequency text default 'monthly',
  deductible numeric,
  renewal_date date,
  notes text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists policies_user_id_created_at_idx
  on public.policies (user_id, created_at desc);

create index if not exists policies_document_id_idx
  on public.policies (document_id);

alter table public.policies enable row level security;

grant select, insert, update, delete on table public.policies to authenticated;

drop policy if exists "Users can select their own policies" on public.policies;
create policy "Users can select their own policies"
  on public.policies
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own policies" on public.policies;
create policy "Users can insert their own policies"
  on public.policies
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      document_id is null
      or exists (
        select 1
        from public.documents
        where documents.id = document_id
          and documents.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can update their own policies" on public.policies;
create policy "Users can update their own policies"
  on public.policies
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      document_id is null
      or exists (
        select 1
        from public.documents
        where documents.id = document_id
          and documents.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can delete their own policies" on public.policies;
create policy "Users can delete their own policies"
  on public.policies
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_policy_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists policies_set_updated_at on public.policies;
create trigger policies_set_updated_at
  before update on public.policies
  for each row
  execute function public.set_policy_updated_at();
