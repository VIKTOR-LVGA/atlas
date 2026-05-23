create table if not exists public.extraction_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid references public.policies(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  correction_type text not null,
  provider text,
  policy_type text,
  coverage_name text,
  coverage_kind text,
  coverage_stable_key text,
  previous_assignment jsonb,
  corrected_assignment jsonb not null,
  source_context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists extraction_corrections_user_id_created_at_idx
  on public.extraction_corrections (user_id, created_at desc);

create index if not exists extraction_corrections_provider_policy_type_idx
  on public.extraction_corrections (user_id, provider, policy_type);

alter table public.extraction_corrections enable row level security;

grant select, insert, update, delete on table public.extraction_corrections to authenticated;

drop policy if exists "Users can select their own extraction corrections" on public.extraction_corrections;
create policy "Users can select their own extraction corrections"
  on public.extraction_corrections
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own extraction corrections" on public.extraction_corrections;
create policy "Users can insert their own extraction corrections"
  on public.extraction_corrections
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own extraction corrections" on public.extraction_corrections;
create policy "Users can update their own extraction corrections"
  on public.extraction_corrections
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own extraction corrections" on public.extraction_corrections;
create policy "Users can delete their own extraction corrections"
  on public.extraction_corrections
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
