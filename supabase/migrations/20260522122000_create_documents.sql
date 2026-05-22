create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

grant select, insert, update, delete on table public.documents to authenticated;

drop policy if exists "Documents are selectable by their owner" on public.documents;
create policy "Documents are selectable by their owner"
  on public.documents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Documents are insertable by their owner" on public.documents;
create policy "Documents are insertable by their owner"
  on public.documents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Documents are updatable by their owner" on public.documents;
create policy "Documents are updatable by their owner"
  on public.documents
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Documents are deletable by their owner" on public.documents;
create policy "Documents are deletable by their owner"
  on public.documents
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_document_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute procedure public.set_document_updated_at();

insert into storage.buckets (id, name, public)
values ('policy-documents', 'policy-documents', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Policy documents are readable by their owner" on storage.objects;
create policy "Policy documents are readable by their owner"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Policy documents are uploadable by their owner" on storage.objects;
create policy "Policy documents are uploadable by their owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Policy documents are updatable by their owner" on storage.objects;
create policy "Policy documents are updatable by their owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Policy documents are deletable by their owner" on storage.objects;
create policy "Policy documents are deletable by their owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
